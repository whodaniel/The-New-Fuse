export declare class Workspace {
    static create(data: any): Promise<any>;
    static get(slug: string): Promise<{
        slug: string;
    }>;
    static update(slug: string, data: any): Promise<any>;
    static delete(slug: string): Promise<boolean>;
}
