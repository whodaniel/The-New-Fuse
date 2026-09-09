import importlib.util
from pathlib import Path
import os
import subprocess
import tempfile
import time
import unittest

spec = importlib.util.spec_from_file_location('retention', Path(__file__).with_name('artifact-retention.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)

class ArchiveTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve()
        self.source = self.root / 'closed.log'
        self.source.write_bytes(b'repeated diagnostic\n' * 10000)
        self.source.chmod(0o700)
        old = time.time() - 20 * 86400
        os.utime(self.source, (old, old))
        self.store = self.root / 'cold'

    def tearDown(self):
        self.tmp.cleanup()

    def test_roundtrip_and_no_clobber(self):
        original = self.source.read_bytes()
        mtime = self.source.stat().st_mtime_ns
        result = r.archive(self.source, self.store, reason='test')
        self.assertFalse(self.source.exists())
        self.assertLess(result['archiveBytes'], result['sourceBytes'])
        r.restore(Path(result['receipt']))
        self.assertEqual(original, self.source.read_bytes())
        self.assertEqual(mtime, self.source.stat().st_mtime_ns)
        self.assertEqual(0o700, self.source.stat().st_mode & 0o777)
        with self.assertRaises(ValueError):
            r.restore(Path(result['receipt']))

    def test_open_file_is_preserved(self):
        # Real child holds the source open; no mocked process check.
        child = subprocess.Popen(['python3', '-c',
            'import sys,time; f=open(sys.argv[1]); print("ready",flush=True); time.sleep(30)',
            str(self.source)], stdout=subprocess.PIPE, text=True)
        try:
            self.assertEqual(child.stdout.readline().strip(), 'ready')
            with self.assertRaises(ValueError):
                r.archive(self.source, self.store, reason='test')
            self.assertTrue(self.source.exists())
        finally:
            child.terminate()
            child.wait()
            child.stdout.close()

    def test_corrupt_existing_object_retains_source(self):
        with self.source.open('rb') as f:
            sha = r.digest(f)
        self.store.mkdir()
        (self.store / (sha + '.gz')).write_bytes(b'corrupt')
        with self.assertRaises(Exception):
            r.archive(self.source, self.store, reason='test')
        self.assertTrue(self.source.exists())

    def test_recent_and_symlink_sources_preserved(self):
        os.utime(self.source, None)
        with self.assertRaises(ValueError):
            r.archive(self.source, self.store, reason='test')
        link = self.root / 'link'
        link.symlink_to(self.source)
        with self.assertRaises(ValueError):
            r.archive(link, self.store, reason='test')
        self.assertTrue(self.source.exists())

    def test_duplicate_bytes_one_object_two_restore_paths(self):
        other = self.root / 'other.log'
        other.write_bytes(self.source.read_bytes())
        old = time.time() - 20 * 86400
        os.utime(other, (old, old))
        a = r.archive(self.source, self.store, reason='test')
        b = r.archive(other, self.store, reason='test')
        self.assertEqual(len(list(self.store.glob('*.gz'))), 1)
        r.restore(Path(a['receipt']))
        r.restore(Path(b['receipt']))
        self.assertEqual(self.source.read_bytes(), other.read_bytes())

if __name__ == '__main__':
    unittest.main()
