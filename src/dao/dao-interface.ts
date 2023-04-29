export interface IDao<T, ID> {
    create(model: T): Promise<T>;
    read(id: ID): Promise<T>;
    update(updated: T): Promise<T>;
    delete(id: ID): Promise<void>;
}
