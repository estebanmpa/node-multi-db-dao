import { Pool, PoolClient } from 'pg';


class Database {
    private static _instance: Database;
    private _pool: Pool;

    constructor() { }

    public static getInstance = () => {
        if (!Database._instance) {
            Database._instance = new Database();
        }
        return Database._instance;
    }

    public createPool = async (config: any) => {
        try {
            this._pool = new Pool(config);
            return await this._pool.connect();
        } catch (error) {
            throw (error);
        }
    }

    public getClient = async () => {
        try {
            const client: PoolClient = await this._pool.connect();
            return client;
        } catch (error) {
            throw (error);
        }
    }
}

export default Database;
