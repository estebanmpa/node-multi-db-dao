export interface IDaoFilter {
    param: string;
    value: any;
}

export class DaoFilter implements IDaoFilter {
    param: string;
    value: any;

    constructor(param: string, value: any) {
        this.param = param;
        this.value = value;
    }
}
