/**
 * screencap.c — Native macOS screen capture → BGRA buffer (Python C extension)
 * 
 * Uses Quartz CoreGraphics directly, bypassing mss's Python wrapper.
 * Target: <50ms capture (vs 85ms mss) → 15+ FPS when paired with turbojpeg.
 * 
 * Build:  cc -O3 -march=native -shared -o screencap.so screencap.c \
 *           -I$PYTHON_INC -framework Cocoa -lpython3.14
 * 
 * Part of LLVM Forge Phase 0 — iPhone Vision Bridge.
 */

#include <Python.h>
#include <ApplicationServices/ApplicationServices.h>
#include <turbojpeg.h>

/**
 * Capture the main display → BGRA bytes.
 * Returns: (width, height, bytes) tuple
 * 
 * Uses CGWindowListCreateImage to grab the full screen,
 * then copies pixel data out of the CGImage into a Python bytes object.
 */
static PyObject* py_capture_bgra(PyObject* self, PyObject* args) {
    int display_index = 0;  // Default to main display
    
    if (!PyArg_ParseTuple(args, "|i", &display_index))
        return NULL;
    
    // Get main display ID
    uint32_t display_count;
    CGGetOnlineDisplayList(0, NULL, &display_count);
    CGDirectDisplayID* displays = (CGDirectDisplayID*)malloc(display_count * sizeof(CGDirectDisplayID));
    if (!displays) {
        PyErr_NoMemory();
        return NULL;
    }
    CGGetOnlineDisplayList(display_count, displays, &display_count);
    
    CGDirectDisplayID display_id = (display_index < (int)display_count) 
                                   ? displays[display_index] 
                                   : displays[0];
    free(displays);
    
    // Get display bounds (logical coordinates, not Retina pixels)
    CGRect bounds = CGDisplayBounds(display_id);
    int width = (int)bounds.size.width;
    int height = (int)bounds.size.height;
    
    // Capture at LOGICAL resolution using bounds in point coordinates
    // kCGWindowImageNominalResolutionRatio = 1.0 (logical, not Retina)
    CGImageRef image = CGWindowListCreateImage(
        bounds,
        kCGWindowListOptionOnScreenOnly,
        kCGNullWindowID,
        kCGWindowImageNominalResolution
    );
    
    if (!image) {
        PyErr_SetString(PyExc_RuntimeError, "CGWindowListCreateImage returned NULL");
        return NULL;
    }
    
    int img_width = (int)CGImageGetWidth(image);
    int img_height = (int)CGImageGetHeight(image);
    
    // Create a bitmap context to get BGRA data
    int bytes_per_row = img_width * 4;
    int buf_size = bytes_per_row * img_height;
    unsigned char* bgra_buf = (unsigned char*)calloc(buf_size, 1);
    if (!bgra_buf) {
        CGImageRelease(image);
        PyErr_NoMemory();
        return NULL;
    }
    
    CGColorSpaceRef color_space = CGColorSpaceCreateDeviceRGB();
    if (!color_space) {
        free(bgra_buf);
        CGImageRelease(image);
        PyErr_SetString(PyExc_RuntimeError, "CGColorSpaceCreateDeviceRGB failed");
        return NULL;
    }
    
    CGContextRef ctx = CGBitmapContextCreate(
        bgra_buf, img_width, img_height, 8, bytes_per_row,
        color_space, kCGImageAlphaNoneSkipFirst | kCGBitmapByteOrder32Host
    );
    
    if (!ctx) {
        CGColorSpaceRelease(color_space);
        free(bgra_buf);
        CGImageRelease(image);
        PyErr_SetString(PyExc_RuntimeError, "CGBitmapContextCreate failed");
        return NULL;
    }
    
    // Draw the captured image into our bitmap context
    CGContextDrawImage(ctx, CGRectMake(0, 0, img_width, img_height), image);
    
    // Flip vertically (CGImage is top-down, we want bottom-up like mss)
    // Actually, mss returns top-down, so let's keep it consistent
    // But CGContextDrawImage draws flipped... let's flip it back
    unsigned char* flipped = (unsigned char*)malloc(buf_size);
    if (flipped) {
        for (int y = 0; y < img_height; y++) {
            memcpy(flipped + y * bytes_per_row,
                   bgra_buf + (img_height - 1 - y) * bytes_per_row,
                   bytes_per_row);
        }
        // Swap into bgra_buf
        memcpy(bgra_buf, flipped, buf_size);
        free(flipped);
    }
    
    // Create Python bytes from the BGRA buffer
    PyObject* py_bytes = PyBytes_FromStringAndSize((const char*)bgra_buf, buf_size);
    
    // Cleanup
    CGContextRelease(ctx);
    CGColorSpaceRelease(color_space);
    CGImageRelease(image);
    free(bgra_buf);
    
    if (!py_bytes) {
        return NULL;
    }
    
    // Return (width, height, bgra_bytes)
    return Py_BuildValue("iiO", img_width, img_height, py_bytes);
}

/**
 * One-shot capture → JPEG using CoreGraphics + turbojpeg.
 * This combines capture and encode in a single C call to eliminate
 * all Python overhead between capture and encode.
 */
static PyObject* py_capture_jpeg(PyObject* self, PyObject* args) {
    int quality = 60;
    
    if (!PyArg_ParseTuple(args, "|i", &quality))
        return NULL;
    
    // Get main display
    uint32_t display_count;
    CGGetOnlineDisplayList(0, NULL, &display_count);
    CGDirectDisplayID* displays = (CGDirectDisplayID*)malloc(display_count * sizeof(CGDirectDisplayID));
    if (!displays) {
        PyErr_NoMemory();
        return NULL;
    }
    CGGetOnlineDisplayList(display_count, displays, &display_count);
    CGDirectDisplayID display_id = displays[0];
    free(displays);
    
    CGRect bounds = CGDisplayBounds(display_id);
    
    // Capture at logical resolution (not Retina)
    CGImageRef image = CGWindowListCreateImage(
        bounds, kCGWindowListOptionOnScreenOnly,
        kCGNullWindowID, kCGWindowImageNominalResolution
    );
    
    if (!image) {
        PyErr_SetString(PyExc_RuntimeError, "CGWindowListCreateImage failed");
        return NULL;
    }
    
    int width = (int)CGImageGetWidth(image);
    int height = (int)CGImageGetHeight(image);
    int bytes_per_row = width * 4;
    int buf_size = bytes_per_row * height;
    
    // Get BGRA bitmap
    unsigned char* bgra_buf = (unsigned char*)calloc(buf_size, 1);
    CGColorSpaceRef color_space = CGColorSpaceCreateDeviceRGB();
    CGContextRef ctx = CGBitmapContextCreate(
        bgra_buf, width, height, 8, bytes_per_row,
        color_space, kCGImageAlphaNoneSkipFirst | kCGBitmapByteOrder32Host
    );
    CGContextDrawImage(ctx, CGRectMake(0, 0, width, height), image);
    
    // Flip vertically
    unsigned char* row_buf = (unsigned char*)malloc(bytes_per_row);
    for (int y = 0; y < height / 2; y++) {
        unsigned char* top = bgra_buf + y * bytes_per_row;
        unsigned char* bot = bgra_buf + (height - 1 - y) * bytes_per_row;
        memcpy(row_buf, top, bytes_per_row);
        memcpy(top, bot, bytes_per_row);
        memcpy(bot, row_buf, bytes_per_row);
    }
    free(row_buf);
    
    // Encode with turbojpeg
    unsigned char* jpeg_buf = NULL;
    unsigned long jpeg_size = 0;
    
    tjhandle tj = tjInitCompress();
    if (tj) {
        tjCompress2(tj, bgra_buf, width, bytes_per_row, height, TJPF_BGRX,
                    &jpeg_buf, &jpeg_size, TJSAMP_420, quality, 0);
        tjDestroy(tj);
    }
    
    // Cleanup CoreGraphics
    CGContextRelease(ctx);
    CGColorSpaceRelease(color_space);
    CGImageRelease(image);
    
    PyObject* result = NULL;
    if (jpeg_buf && jpeg_size > 0) {
        result = PyBytes_FromStringAndSize((const char*)jpeg_buf, jpeg_size);
        tjFree(jpeg_buf);
    } else {
        // Fallback: return raw BGRA
        result = PyBytes_FromStringAndSize((const char*)bgra_buf, buf_size);
    }
    
    free(bgra_buf);
    return result;
}

static PyMethodDef methods[] = {
    {"capture_bgra", py_capture_bgra, METH_VARARGS,
     "Capture screen → (width, height, BGRA_bytes). Args: [display_index=0]"},
    {"capture_jpeg", py_capture_jpeg, METH_VARARGS,
     "Capture screen → JPEG bytes (one-shot, no Python overhead). Args: [quality=60]"},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT,
    "screencap",
    "Native macOS screen capture via CoreGraphics (LLVM Forge Phase 0)",
    -1,
    methods
};

PyMODINIT_FUNC PyInit_screencap(void) {
    return PyModule_Create(&module);
}
