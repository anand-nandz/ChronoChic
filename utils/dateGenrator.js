const generateDate=()=>{
    const currentDate=new Date();
    const day=currentDate.getDate();
    const month=currentDate.getMonth() +1;
    const year=currentDate.getFullYear();
    const formateDate=`${day}-${month}-${year}`

    return formateDate;
}

module.exports=generateDate