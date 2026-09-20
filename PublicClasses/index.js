module.exports = async function (context, req) {

    context.log("Ntertainment API - TEST START");

    context.res = {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        body: {
            success: true,
            message: "PublicClasses werkt!"
        }
    };

};
