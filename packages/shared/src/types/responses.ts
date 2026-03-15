export type SuccessResponse<T> = {
    type: "success";
    data: T;
};

export type ErrorResponse = {
    type: "error";
    message: string;
};
