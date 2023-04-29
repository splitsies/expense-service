export interface IDaMapper<DomainModel, DaModel> {
    toDaModel(domainModel: DomainModel): DaModel;
    toDomainModel(daModel: DaModel): DomainModel;
}
