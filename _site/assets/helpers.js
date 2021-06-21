function getRecordByPID(db, pid){
    let payload = false
    db.forEach((record) => {
        console.log(record.pid);
        console.log(pid)
        if (record.pid == pid) {
            console.log("match");
            payload = record;
        }
    });
    return payload
}