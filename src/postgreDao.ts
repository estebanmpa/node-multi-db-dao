import Database from './database';
import format from 'pg-format';
import { PoolClient } from 'pg';
import isNil from 'lodash/isNil';
import { IDaoFilter, DaoFilter } from './models/DaoFilter';
import IGenericDao from './models/GenericDao';

class PostgreDao implements IGenericDao {
    protected entity: String;

    constructor(entity: String) {
        this.entity = entity;
    }

    protected executeCustom = async (sql: string, ...values: any[]): Promise<any> => {
        const client = await Database.getInstance().getClient();

        try {
            const { rows } = await client.query(sql as string, [...values]);
            return rows;
        } catch (error) {
            throw (error);
        } finally {
            client.release();
        }
    }

    protected executeCustomWithTransaction = async (sql: string, client: PoolClient, ...values: any[]): Promise<any> => {
        //console.log(sql)
        try {
            const { rows } = await client.query(sql as string, [...values]);
            return rows;
        } catch (error) {
            throw (error);
        }
    }

    public retrieve = async (filterList: IDaoFilter[] = [], orderByList: IDaoFilter[] = []): Promise<any[]> => {
        try {
            const sql: string = format('select * from %I where 1=1', this.entity);
            const results = await this.retrieveCustom(sql, filterList, orderByList);
            return results;
        } catch (error) {
            throw (error);
        }
    }

    public retrieveByID = async (id: number): Promise<any> => {
        try {
            const filters: DaoFilter[] = [];
            filters.push(new DaoFilter('id', id));
            const result = await this.retrieve(filters);
            return result;
        } catch (error) {
            throw (error);
        }
    }

    public retrieveCustom = async (sql: string, filterList: IDaoFilter[] = [], orderByList: IDaoFilter[] = []): Promise<any[]> => {
        let client: PoolClient;

        try {
            client = await Database.getInstance().getClient();

            // Where conditions
            const values: any[] = [];
            const sqlFilters = filterList.map((f, i) => {

                if (f.value === 'null') {
                    return ` and ${f.param} is null `;
                } else {
                    values.push(f.value);
                    return ` and ${f.param} = $${i + 1} `;
                }
            })
            sql = sql + sqlFilters.join('');

            // Order by fields
            if (orderByList.length > 0) {
                const sqlOrders = orderByList.map((f, i) => {
                    return ` ${f.param} ${f.value} `; // param: field name. value: ASC or DESC.
                });
                sql = sql + ' order by ' + sqlOrders.join();
            }

            // console.log('sql', sql);
            const { rows } = await client.query(sql, values);
            return rows;
        } catch (error) {
            throw (error);
        } finally {
            client.release();
        }
    }

    public async save(data: any, client: PoolClient = null): Promise<any> {
        const transaction: Boolean = !isNil(client);
        const inserting: Boolean = isNil(data.id);

        try {

            if (!transaction) {
                client = await Database.getInstance().getClient();
            }

            const sql: string = this.buildQuery(data);

            delete data.id;
            const values = Object.values(data);
            const { rows } = await client.query(sql, (inserting) ? [] : [...values]);

            return rows[0];
        } catch (error) {
            throw (error);
        } finally {
            if (!transaction) {
                this.releaseConnection(client);
            }
        }
    }

    public delete = async (id: number): Promise<any> => {
        let client: PoolClient;

        try {
            client = await Database.getInstance().getClient();
            const sql: string = format('delete from %I where id=%L', this.entity, id);
            const { rows } = await client.query(sql);
            return rows;
        } catch (error) {
            throw (error);
        } finally {
            this.releaseConnection(client);
        }
    }

    //TODO: Json data type support. pg-format is not formating correctly
    protected buildQuery = (data: any): string => {
        const inserting: Boolean = isNil(data.id);
        const id = data['id'];
        delete data.id;
        const keys = Object.keys(data);
        const values = Object.values(data);
        let sql: string;

        //console.log(values)

        if (inserting) {
            sql = format(`insert into %I (%I) values (%L) returning *`, this.entity, keys, values);
        }
        else {
            const set: String[] = [];

            keys.forEach((key, idx) => {
                set.push(` ${key}=$${idx + 1}`);
            });
            sql = 'update %I set /VALUES/ where id=%L returning *';
            sql = sql.replace('/VALUES/', set.join(','));
            sql = format(sql, this.entity, id);
        }
        //console.info('sql: ' + sql);
        return sql;
    }

    protected beginTransaction = async (): Promise<PoolClient> => {
        const client = await Database.getInstance().getClient();
        await client.query('BEGIN');
        return client;
    }

    protected commitTransaction = async (client: PoolClient): Promise<void> => {
        await client.query('COMMIT');
        this.releaseConnection(client);
    }

    protected rollbackTransaction = async (client: PoolClient): Promise<void> => {
        await client.query('ROLLBACK');
        this.releaseConnection(client);
    }

    private releaseConnection = async (client: PoolClient): Promise<void> => {
        if (client) {
            client.release();
            client = null;
        }
    }
}

export default PostgreDao;