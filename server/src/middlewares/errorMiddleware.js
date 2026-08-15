const errorMiddleware = (err, req, res, next) => {
    return res.status(500).json({
        message:"Something went wrong",
        success:false
    });
};

export default errorMiddleware;
