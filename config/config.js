const sessionSecret = "mysitesessionsecret";
// const a= require('dotenv')

// a.config();

const emailUser = process.env.emailUser
const emailPassword = process.env.emailPassword

module.exports= {
    sessionSecret,
    emailUser,
    emailPassword
}


