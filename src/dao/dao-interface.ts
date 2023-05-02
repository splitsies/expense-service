export interface IDao<T, ID> {
    create(model: T): Promise<T>;
    read(key: Record<string, string | number>): Promise<T>;
    update(updated: T): Promise<T>;
    delete(key: Record<string, string | number>): Promise<void>;
}
