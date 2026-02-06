export class Workspace {
  static async create(data: any) {
    console.log('Creating workspace:', data);
    return data;
  }

  static async get(slug: string) {
    console.log('Getting workspace:', slug);
    return { slug };
  }

  static async update(slug: string, data: any) {
    console.log('Updating workspace:', slug, data);
    return data;
  }

  static async delete(slug: string) {
    console.log('Deleting workspace:', slug);
    return true;
  }
}
