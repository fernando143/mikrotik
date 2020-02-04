const admin = require('firebase-admin');
// const SERVICE_ACCOUNT = require('/mikrotik-7a9ff.json');
const RouterOSClient = require('routeros-client').RouterOSClient

admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT),
    databaseURL: "https://mikrotik-7a9ff.firebaseio.com"
});

let db = admin.firestore();
const routeros = new RouterOSClient({
    host: "192.168.3.1",
    user: "admin",
    password: ""
})


routeros.connect()
    .then(client => {
        let queueTree = client.menu("/queue/tree")

        queueTree.query({ interval: 1 })
            .stream('print', ((err, data) => {

                const queuesFiltered = filterQueues(data, ['others_up', 'others_d'])
                const dataSelected = filterObject(queuesFiltered, ['name', 'rate'])

                sendData('lolQos', 'fakeDocName', dataSelected)
            }))
    })
    .catch(err => console.log(err))


const filterQueues = (data, queues) => {
    const originalData = data
    let queuesFiltered = []

    queues.forEach(nameQueue => {
        let currentQueueFiltered = originalData.filter(queue => {
            if (queue.name.toLowerCase() === nameQueue.toLowerCase()) {
                return true
            } else {
                return false
            }
        })

        queuesFiltered.push(...currentQueueFiltered)
    })

    return queuesFiltered
}

const filterObject = (data, nameFilters) => {
    const originalData = data
    let dataFiltered = []

    dataFiltered = originalData.map(item => {
        let object = {}
        nameFilters.forEach(name => {
            object = {
                ...object,
                [name]: item[name]
            }
        })
        return object
    })

    return dataFiltered
}

const sendData = (nameCollection, nameDoc, dataToSend) => {
    let addDoc = db.collection(nameCollection);

    dataToSend.forEach(data => {
        addDoc.add(data)
        .then(ref => {
            console.log('Added document with ID: ', ref.id)
            console.log(data)
            console.log('=============================')
        })
    })

}
