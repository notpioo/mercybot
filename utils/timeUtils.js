
// Jakarta timezone utilities
function getJakartaTime() {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
}

function getJakartaDate() {
    const jakartaTime = getJakartaTime();
    return jakartaTime.toISOString().split('T')[0];
}

function getJakartaDateTime() {
    const jakartaTime = getJakartaTime();
    return jakartaTime.toISOString();
}

function formatJakartaDateTime(date) {
    const jakartaTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    return jakartaTime.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
}

function isNewDay(lastDate) {
    const today = getJakartaDate();
    return lastDate !== today;
}

function getDaysDifference(date1, date2) {
    const jakartaDate1 = new Date(date1.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const jakartaDate2 = new Date(date2.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    
    const timeDiff = Math.abs(jakartaDate2.getTime() - jakartaDate1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

module.exports = {
    getJakartaTime,
    getJakartaDate,
    getJakartaDateTime,
    formatJakartaDateTime,
    isNewDay,
    getDaysDifference
};
