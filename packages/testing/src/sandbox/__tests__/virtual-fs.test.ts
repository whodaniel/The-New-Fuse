import { VirtualFileSystem } from '../virtual-fs.js';

describe('VirtualFileSystem', () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  afterEach(() => {
    vfs.reset();
  });

  describe('File Operations', () => {
    it('should write and read files', () => {
      const content = 'test content';
      vfs.writeFile('/test.txt', content);
      expect(vfs.readFile('/test.txt')).toBe(content);
    });

    it('should check if files exist', () => {
      vfs.writeFile('/test.txt', 'content');
      expect(vfs.exists('/test.txt')).toBe(true);
      expect(vfs.exists('/nonexistent.txt')).toBe(false);
    });

    it('should delete files', () => {
      vfs.writeFile('/test.txt', 'content');
      expect(vfs.exists('/test.txt')).toBe(true);
      vfs.delete('/test.txt');
      expect(vfs.exists('/test.txt')).toBe(false);
    });

    it('should create nested directories automatically', () => {
      vfs.writeFile('/dir1/dir2/test.txt', 'content');
      expect(vfs.exists('/dir1/dir2/test.txt')).toBe(true);
    });
  });

  describe('Directory Operations', () => {
    it('should list files in directory', () => {
      vfs.writeFile('/dir1/file1.txt', 'content1');
      vfs.writeFile('/dir1/file2.txt', 'content2');
      const files = vfs.listFiles('/dir1');
      expect(files).toHaveLength(2);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });

    it('should create directories', () => {
      vfs.mkdir('/dir1/dir2');
      expect(vfs.exists('/dir1/dir2')).toBe(true);
    });

    it('should get file stats', () => {
      const content = 'test content';
      vfs.writeFile('/test.txt', content);
      const stats = vfs.getStats('/test.txt');
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBe(content.length);
    });
  });

  describe('Initialization', () => {
    it('should initialize with provided files', () => {
      const initialFiles = {
        '/test1.txt': 'content1',
        '/dir/test2.txt': 'content2'
      };
      vfs = new VirtualFileSystem({ initialFiles });
      
      expect(vfs.readFile('/test1.txt')).toBe('content1');
      expect(vfs.readFile('/dir/test2.txt')).toBe('content2');
    });

    it('should use custom root directory', () => {
      vfs = new VirtualFileSystem({ root: '/custom' });
      vfs.writeFile('/test.txt', 'content');
      expect(vfs.exists('/test.txt')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw when reading non-existent file', () => {
      expect(() => vfs.readFile('/nonexistent.txt')).toThrow();
    });

    it('should throw when getting stats of non-existent file', () => {
      expect(() => vfs.getStats('/nonexistent.txt')).toThrow();
    });
  });
});