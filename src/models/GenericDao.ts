import { IDaoFilter } from "./DaoFilter";

interface IGenericDao {
    retrieve(filterList: IDaoFilter[], orderByList: IDaoFilter[]): Promise<any[]>;
    retrieveByID(id: number): Promise<any>;
    save(data: any, client: any): Promise<any>;
    delete(id: number): Promise<any>;
}

export default IGenericDao;