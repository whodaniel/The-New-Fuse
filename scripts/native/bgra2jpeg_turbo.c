/**
 * bgra2jpeg_turbo.c — Zero-copy BGRA → JPEG via libjpeg-turbo (SIMD)
 * 
 * Uses libturbojpeg which has AVX2/SSE2 SIMD acceleration.
 * On 2015 Haswell MBP this should be 2-4x faster than stock libjpeg.
 * 
 * Build:  cc -O3 -march=native -shared -o bgra2jpeg_turbo.so bgra2jpeg_turbo.c \
 *           -I$PYTHON_INC -L/usr/local/lib -lturbojpeg -lpython3.14
 * 
 * Target: 12-15 FPS (vs 8.3 FPS with stock libjpeg)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <turbojpeg.h>
#include <Python.h>

static PyObject* py_bgra2jpeg_turbo(PyObject* self, PyObject* args) {
    Py_buffer buf;
    int width, height, quality;
    
    if (!PyArg_ParseTuple(args, "y*iii", &buf, &width, &height, &quality))
        return NULL;
    
    if (buf.len < (Py_ssize_t)(width * height * 4)) {
        PyBuffer_Release(&buf);
        PyErr_SetString(PyExc_ValueError, "Buffer too small for given width*height*4");
        return NULL;
    }
    
    // Convert BGRA → RGB in-place (we don't modify the original buffer)
    // We need a temporary RGB buffer since turbojpeg expects RGB
    unsigned char* rgb_data = (unsigned char*)malloc(width * height * 3);
    if (!rgb_data) {
        PyBuffer_Release(&buf);
        PyErr_NoMemory();
        return NULL;
    }
    
    const unsigned char* bgra = (const unsigned char*)buf.buf;
    for (int i = 0; i < width * height; i++) {
        rgb_data[i * 3 + 0] = bgra[i * 4 + 2]; // R
        rgb_data[i * 3 + 1] = bgra[i * 4 + 1]; // G
        rgb_data[i * 3 + 2] = bgra[i * 4 + 0]; // B
    }
    PyBuffer_Release(&buf);
    
    // Encode with turbojpeg (SIMD-accelerated)
    unsigned char* jpeg_buf = NULL;
    unsigned long jpeg_size = 0;
    
    tjhandle handle = tjInitCompress();
    if (!handle) {
        free(rgb_data);
        PyErr_SetString(PyExc_RuntimeError, "tjInitCompress failed");
        return NULL;
    }
    
    int ok = tjCompress2(handle, rgb_data, width, 0, height, TJPF_RGB,
                         &jpeg_buf, &jpeg_size, TJSAMP_420, quality, 0);
    free(rgb_data);
    
    if (ok != 0) {
        tjDestroy(handle);
        PyErr_SetString(PyExc_RuntimeError, "tjCompress2 failed");
        return NULL;
    }
    
    PyObject* result = PyBytes_FromStringAndSize((const char*)jpeg_buf, jpeg_size);
    tjFree(jpeg_buf);
    tjDestroy(handle);
    return result;
}

/* BGRA-native path — tell turbojpeg the input is BGRA, skip the conversion */
static PyObject* py_bgra2jpeg_turbo_native(PyObject* self, PyObject* args) {
    Py_buffer buf;
    int width, height, quality;
    
    if (!PyArg_ParseTuple(args, "y*iii", &buf, &width, &height, &quality))
        return NULL;
    
    if (buf.len < (Py_ssize_t)(width * height * 4)) {
        PyBuffer_Release(&buf);
        PyErr_SetString(PyExc_ValueError, "Buffer too small for given width*height*4");
        return NULL;
    }
    
    const unsigned char* bgra = (const unsigned char*)buf.buf;
    
    unsigned char* jpeg_buf = NULL;
    unsigned long jpeg_size = 0;
    
    tjhandle handle = tjInitCompress();
    if (!handle) {
        PyBuffer_Release(&buf);
        PyErr_SetString(PyExc_RuntimeError, "tjInitCompress failed");
        return NULL;
    }
    
    // TJPF_BGRX tells turbojpeg: input is BGRX (4 bytes/pixel, skip alpha)
    // This is exactly what mss gives us — zero conversion needed!
    int ok = tjCompress2(handle, bgra, width, width * 4, height, TJPF_BGRX,
                         &jpeg_buf, &jpeg_size, TJSAMP_420, quality, 0);
    PyBuffer_Release(&buf);
    
    if (ok != 0) {
        tjDestroy(handle);
        PyErr_SetString(PyExc_RuntimeError, "tjCompress2 with BGRX failed");
        return NULL;
    }
    
    PyObject* result = PyBytes_FromStringAndSize((const char*)jpeg_buf, jpeg_size);
    tjFree(jpeg_buf);
    tjDestroy(handle);
    return result;
}

static PyMethodDef methods[] = {
    {"bgra2jpeg_turbo", py_bgra2jpeg_turbo, METH_VARARGS,
     "Encode BGRA buffer to JPEG via libjpeg-turbo (RGB path). Args: (buffer, width, height, quality)"},
    {"bgra2jpeg_turbo_native", py_bgra2jpeg_turbo_native, METH_VARARGS,
     "Encode BGRA buffer to JPEG via libjpeg-turbo (BGRX zero-conv path). Args: (buffer, width, height, quality)"},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT,
    "bgra2jpeg_turbo",
    "SIMD-accelerated BGRA -> JPEG encoder via libjpeg-turbo (LLVM Forge Phase 0)",
    -1,
    methods
};

PyMODINIT_FUNC PyInit_bgra2jpeg_turbo(void) {
    return PyModule_Create(&module);
}
