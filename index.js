import dotenv from 'dotenv';
import Opaler from 'opaler';
import {DateTime} from 'luxon';

dotenv.config({
    path: 'dev.env'
});

const isATrip = (transaction) => !!transaction.journey;
const isAMorningCommute = transaction => {
    const timestamp = DateTime.fromSeconds(transaction.timestamp);
    const isWithinTimeBound = timestamp.hour >= 6 && timestamp.hour <= 10;
    // TODO: weekly bounds
    return isWithinTimeBound;
}

const getPagedTransactions = async (opaler, page, cardIdx) => {
    const transactions = await opaler.getTransactions({
        pageIndex: page,
        cardIndex: cardIdx,
    });

    const transactionsFiltered = transactions
        .filter(isATrip)
        .filter(isAMorningCommute);

    return transactionsFiltered;
}

const getTransactions = async () => {
    const opaler = new Opaler(process.env.OPAL_USERNAME, process.env.OPAL_PASSWORD);

    const cards = await opaler.getCards();

    // Workaround to grab my non-student card
    const selectedCard = cards.find(card => card.cardState !== 'HOTLISTED');

    const transactionsFiltered = await getPagedTransactions(opaler, 1, selectedCard.cardIndex);

    transactionsFiltered.forEach(tx => {
        console.log(tx.summary);
    });
}

getTransactions();