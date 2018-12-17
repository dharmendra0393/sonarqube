/*
 * SonarQube
 * Copyright (C) 2009-2018 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import DeliveryAccordion from './DeliveryAccordion';
import { Button } from '../../../components/ui/buttons';
import DeferredSpinner from '../../../components/common/DeferredSpinner';
import ListFooter from '../../../components/controls/ListFooter';
import Modal from '../../../components/controls/Modal';
import { translateWithParameters, translate } from '../../../helpers/l10n';
import { searchDeliveries } from '../../../api/webhooks';

interface Props {
  onClose: () => void;
  webhook: T.Webhook;
}

interface State {
  deliveries: T.WebhookDelivery[];
  loading: boolean;
  paging?: T.Paging;
}

const PAGE_SIZE = 10;

export default class DeliveriesForm extends React.PureComponent<Props, State> {
  mounted = false;
  state: State = { deliveries: [], loading: true };

  componentDidMount() {
    this.mounted = true;
    this.fetchDeliveries();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchDeliveries = ({ webhook } = this.props) => {
    searchDeliveries({ webhook: webhook.key, ps: PAGE_SIZE }).then(({ deliveries, paging }) => {
      if (this.mounted) {
        this.setState({ deliveries, loading: false, paging });
      }
    }, this.stopLoading);
  };

  fetchMoreDeliveries = ({ webhook } = this.props) => {
    const { paging } = this.state;
    if (paging) {
      this.setState({ loading: true });
      searchDeliveries({ webhook: webhook.key, p: paging.pageIndex + 1, ps: PAGE_SIZE }).then(
        ({ deliveries, paging }) => {
          if (this.mounted) {
            this.setState((state: State) => ({
              deliveries: [...state.deliveries, ...deliveries],
              loading: false,
              paging
            }));
          }
        },
        this.stopLoading
      );
    }
  };

  stopLoading = () => {
    if (this.mounted) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { webhook } = this.props;
    const { deliveries, loading, paging } = this.state;
    const header = translateWithParameters('webhooks.deliveries_for_x', webhook.name);

    return (
      <Modal contentLabel={header} onRequestClose={this.props.onClose}>
        <header className="modal-head">
          <h2>{header}</h2>
        </header>
        <div className="modal-body modal-container">
          {deliveries.map(delivery => (
            <DeliveryAccordion delivery={delivery} key={delivery.id} />
          ))}
          <div className="text-center">
            <DeferredSpinner loading={loading} />
          </div>
          {paging !== undefined && (
            <ListFooter
              className="little-spacer-bottom"
              count={deliveries.length}
              loadMore={this.fetchMoreDeliveries}
              ready={!loading}
              total={paging.total}
            />
          )}
        </div>
        <footer className="modal-foot">
          <Button className="button-link js-modal-close" onClick={this.props.onClose}>
            {translate('close')}
          </Button>
        </footer>
      </Modal>
    );
  }
}