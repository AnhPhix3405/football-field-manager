import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from 'typeorm';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected constructor(protected readonly repo: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    return this.repo.findOneBy({ id } as unknown as FindOptionsWhere<T>);
  }

  find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repo.findOne(options);
  }

  create(data: DeepPartial<T>): T {
    return this.repo.create(data);
  }

  save(entity: T): Promise<T>;
  save(entities: T[]): Promise<T[]>;
  save(entityOrEntities: T | T[]): Promise<T | T[]> {
    return Array.isArray(entityOrEntities)
      ? this.repo.save(entityOrEntities)
      : this.repo.save(entityOrEntities);
  }

  update(
    criteria: FindOptionsWhere<T>,
    data: DeepPartial<T>,
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, data as never);
  }

  delete(criteria: FindOptionsWhere<T>): Promise<DeleteResult> {
    return this.repo.delete(criteria);
  }

  count(options?: FindManyOptions<T>): Promise<number> {
    return this.repo.count(options);
  }
}
