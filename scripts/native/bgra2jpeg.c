/**
 * bgra2jpeg.c — Zero-copy BGRA → JPEG encoder for TNF Remote Relay
 * 
 * Takes a raw BGRA framebuffer pointer (from mss) and produces JPEG bytes
 * directly, skipping the Python → numpy → PIL/simplejpeg round-trip
 * that costs ~220ms on 2015 Haswell MBP.
 * 
 * Build:  cc -O3 -march=native -shared -o bgra2jpeg.so bgra2jpeg.c -ljpeg
 * Use:    See bgra2jpeg.py wrapper
 * 
 * Target: 10-15 FPS (vs 3.5 FPS with Python encode pipeline)
 * 
 * Phase 0 of TNF LLVM Forge — first native forge for iPhone Vision Bridge.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <jpeglib.h>
#include <Python.h>

/**
 * Encode BGRA buffer to JPEG in memory.
 * 
 * @param bgra_data  Pointer to BGRA pixel data (top-down, 4 bytes/pixel)
 * @param width      Image width in pixels
 * @param height     Image height in pixels  
 * @param quality    JPEG quality (1-100, typically 60)
 * @param out_size   Output: number of bytes written
 * @return           Pointer to JPEG data (caller must free), or NULL on error
 */
static unsigned char* bgra_to_jpeg(
    const unsigned char* bgra_data,
    int width, int height, int quality,
    unsigned long* out_size
) {
    struct jpeg_compress_struct cinfo;
    struct jpeg_error_mgr jerr;
    
    cinfo.err = jpeg_std_error(&jerr);
    jpeg_create_compress(&cinfo);
    
    // Destination: memory buffer
    unsigned char* outbuffer = NULL;
    unsigned long outsize = 0;
    jpeg_mem_dest(&cinfo, &outbuffer, &outsize);
    
    cinfo.image_width = width;
    cinfo.image_height = height;
    cinfo.input_components = 3;      // RGB output
    cinfo.in_color_space = JCS_RGB;
    
    jpeg_set_defaults(&cinfo);
    jpeg_set_quality(&cinfo, quality, 1);
    
    jpeg_start_compress(&cinfo, TRUE);
    
    // Scanline buffer: convert BGRA → RGB row by row (zero-copy on read side)
    JSAMPROW row_pointer[1];
    unsigned char* rgb_row = (unsigned char*)malloc(width * 3);
    if (!rgb_row) {
        jpeg_destroy_compress(&cinfo);
        return NULL;
    }
    
    while (cinfo.next_scanline < cinfo.image_height) {
        const unsigned char* bgra_row = bgra_data + (cinfo.next_scanline * width * 4);
        for (int x = 0; x < width; x++) {
            rgb_row[x * 3 + 0] = bgra_row[x * 4 + 2]; // R (from BGR+A)
            rgb_row[x * 3 + 1] = bgra_row[x * 4 + 1]; // G
            rgb_row[x * 3 + 2] = bgra_row[x * 4 + 0]; // B
        }
        row_pointer[0] = rgb_row;
        jpeg_write_scanlines(&cinfo, row_pointer, 1);
    }
    
    free(rgb_row);
    jpeg_finish_compress(&cinfo);
    
    *out_size = outsize;
    // libjpeg allocates with malloc, caller must free
    unsigned char* result = (unsigned char*)malloc(outsize);
    if (result) {
        memcpy(result, outbuffer, outsize);
    }
    free(outbuffer);
    
    jpeg_destroy_compress(&cinfo);
    return result;
}

/* ─── Python C Extension Interface ─── */

static PyObject* py_bgra2jpeg(PyObject* self, PyObject* args) {
    Py_buffer buf;
    int width, height, quality;
    
    if (!PyArg_ParseTuple(args, "y*iii", &buf, &width, &height, &quality))
        return NULL;
    
    if (buf.len < (Py_ssize_t)(width * height * 4)) {
        PyBuffer_Release(&buf);
        PyErr_SetString(PyExc_ValueError, "Buffer too small for given width*height*4");
        return NULL;
    }
    
    unsigned long out_size = 0;
    unsigned char* jpeg_data = bgra_to_jpeg((const unsigned char*)buf.buf, 
                                             width, height, quality, &out_size);
    PyBuffer_Release(&buf);
    
    if (!jpeg_data) {
        PyErr_SetString(PyExc_RuntimeError, "JPEG encoding failed");
        return NULL;
    }
    
    PyObject* result = PyBytes_FromStringAndSize((const char*)jpeg_data, out_size);
    free(jpeg_data);
    return result;
}

static PyMethodDef methods[] = {
    {"bgra2jpeg", py_bgra2jpeg, METH_VARARGS,
     "Encode BGRA buffer to JPEG bytes. Args: (buffer, width, height, quality)"},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT,
    "bgra2jpeg",
    "Zero-copy BGRA → JPEG encoder for TNF Remote Relay (LLVM Forge Phase 0)",
    -1,
    methods
};

PyMODINIT_FUNC PyInit_bgra2jpeg(void) {
    return PyModule_Create(&module);
}
