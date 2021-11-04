export default function getCurrentLocalDateParis(): Date {
    const now = new Date();
    const offset = + 2 * 3600000;
    now.setTime(now.getTime() + offset + now.getTimezoneOffset() * 60000);
    return now;
}