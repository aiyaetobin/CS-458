//the plan for this function will be to take the array returned from find mmsid from classifier 
//and it will take each of those returned mmsids in the function and make an alma api call and for 
//each of them return their use data probably in a hashmap or array then we will iterate 
//through that hashmap and return the mmsid and usage of the 5 least used books of those in the array

async function findUsageFromMMSID(mmsidArray){
    
}

let mmsid = 
    [
    '992150263402909',
    '9910041373302909',
    '992913493402909',
    '99977523402909',
    '991566853402909',
    '99738073402909',
    '992033773402909'
    ];

findUsageFromMMSID(mmsid);
