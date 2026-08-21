import streamDeck from "@elgato/streamdeck";

import { DateTimeAction } from "./actions/datetime-action";

streamDeck.logger.setLevel("info");
streamDeck.actions.registerAction(new DateTimeAction());
streamDeck.connect();
