import dotenv from 'dotenv';
import Opaler from 'opaler';
import {DateTime} from 'luxon';
import * as Rx from 'rxjs';
import * as operators from 'rxjs/operators';

dotenv.config({
    path: 'dev.env'
});

const STOP_DATE = DateTime.local();

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
    
    const source = new Rx.generate(
        1,
        () => true,
        x => x + 1
    )
    .pipe(
    operators.take(100),
    operators.mergeMap(
        (page) => Rx.from(getPagedTransactions(opaler, page, selectedCard.cardIndex)),
        null,
        5));

    const subscription = source.subscribe(
        (result) => {
            const {timestamp} = result[0];
            if (timestamp < 1548800030) {
                subscription.unsubscribe();
            }
            console.log(result);
        },
        null,
        () => {
            console.log('Completed');
        }
    );
}

getTransactions();