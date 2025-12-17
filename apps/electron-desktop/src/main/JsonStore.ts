import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class JsonStore<T> {
  private path: string;
  private data: T[];

  constructor(filename: string, defaults: T[] = []) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, filename);
    this.data = this.parseDataFile(this.path, defaults);
  }

  private parseDataFile(filePath: string, defaults: T[]): T[] {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return defaults;
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error(`Failed to save store to ${this.path}:`, error);
    }
  }

  getAll(): T[] {
    return this.data;
  }

  add(item: T) {
    this.data.push(item);
    this.save();
  }

  set(items: T[]) {
    this.data = items;
    this.save();
  }

  remove(predicate: (item: T) => boolean) {
    this.data = this.data.filter((item) => !predicate(item));
    this.save();
  }

  update(predicate: (item: T) => boolean, updater: (item: T) => T) {
    this.data = this.data.map((item) => (predicate(item) ? updater(item) : item));
    this.save();
  }
}
