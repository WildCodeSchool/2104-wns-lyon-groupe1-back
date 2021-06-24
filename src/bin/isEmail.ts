export default function isEmail(email : string){
    const regex = new RegExp(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
/*     if(regex.test(email)){
        return true;
    }
    return false; */
    return regex.test(email) ?  true :  false;
}