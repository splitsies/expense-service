export interface IDtoMapper<DomainModel, DtoModel> {
    toDtoModel(domainModel: DomainModel): DtoModel;
    toDomainModel(dtoModel: DtoModel): DomainModel;
}
