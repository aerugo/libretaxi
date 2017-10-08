/*
    LibreTaxi, free and open source ride sharing platform.
    Copyright (C) 2016-2017  Roman Pushkin

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Action from '../../../action';
import RequestUserInputResponse from '../../../responses/request-user-input-response';
import CompositeResponse from '../../../responses/composite-response';
import UserStateResponse from '../../../responses/user-state-response';
import TextResponse from '../../../responses/text-response';
import RedirectResponse from '../../../responses/redirect-response';
import uuid from 'uuid';
import ErrorResponse from '../../../responses/error-response';
import CallActionResponse from '../../../responses/call-action-response';
import SubmitOrderResponse from '../../../responses/submit-order/submit-order-response';
import Firebase from 'firebase';
import If from '../../../responses/if-response';
import Numeric from '../../../conditions/numeric';


/**
 * Passenger request destination menu action.
 * Asking passenger to provide destination.
 *
 * @author Roman Pushkin (roman.pushkin@gmail.com)
 * @date 2016-08-11
 * @version 1.1
 * @since 0.1.0
 */
export default class PassengerRequestDestination extends Action {

  /**
   * Constructor.
   */
  constructor(options) {
    super(Object.assign({ type: 'passenger-request-destination' }, options));
  }

  /**
   * Returns `text` and `request user input` responses.
   *
   * @return {CompositeResponse} Returns instance of {@link CompositeResponse}
   * which contains {@link TextResponse} and {@link RequestUserInputResponse}.
   */
  get() {
    return new CompositeResponse()
      .add(new TextResponse({ message: this.t('provide_destination') }))
      .add(new RequestUserInputResponse());
  }

  /**
   * Saves user's destination to state. Responds with OK message, and
   * redirects to request price menu action.
   *
   * @param {string} value - string that represents destination.
   * @return {CompositeResponse} Returns instance of {@link CompositeResponse}
   * that contains the following responses:
   * - {@link UserStateResponse} - with `destination` prop set to `value`
   * - {@link TextResponse} - with OK message
   * - {@link RedirectResponse} - with redirect to request price menu action
   */
  post(value) {
    const orderKey = uuid.v4();
    return new CompositeResponse()
      .add(new UserStateResponse({ destination: value }))
      .add(new SubmitOrderResponse({
        orderKey,
        passengerKey: this.user.userKey,
        passengerLocation: this.user.state.location,
        passengerDestination: this.user.state.destination,
        price: 0,
        createdAt: Firebase.database.ServerValue.TIMESTAMP,
        requestedVehicleType: this.user.state.requestedVehicleType,
      }))
      .add(new CallActionResponse({
        userKey: this.user.userKey,
        route: 'show-message',
        arg: {
          expectedState: {
            menuLocation: 'order-submitted',
            currentOrderKey: orderKey,
          },
          message: this.t('on_timeout'),
          path: 'passenger-index',
        },
        delay: 20 * 60 * 1000,
      }))
      .add(new TextResponse({ message: '👌 OK!' }))
      .add(new RedirectResponse({ path: 'blank-screen' })),
  }
}
