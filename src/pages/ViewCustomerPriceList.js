import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';
import Accordian  from './Accordian';


const customerAPI = 'CustomersAPI';

class ViewCustomers extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedProductID:"",
        currentlySelectedCustomerID:""
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  getCustomerPriceLists = (id) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        product-id: this.state.currentlySelectedProductID
      }
    };
    //this.setState({currentlySelectedCustomerID:id})
    API.get(customerAPI, '/'+id+'/price-list', apiRequest)
    .then(response => {
      //this.setState({currentlySelectedCustomer: JSON.parse(response.body)})
      console.log(JSON.parse(response.body))
    })
  }

  deletePriceItem = (id) => {
    if (window.confirm('Are you sure?')) {
      const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        queryStringParameters: {
          'ID': id
        }
      };
      API.del(customerAPI, '/'+id+'/price-list', apiRequest)
      .then(response => {
        if(response.body["AffectedRows"] === 1)
        {
          var sleep = 3000;
          NotificationManager.success('', 'Price Item Successfully Deleted', sleep);
          this.sleep(sleep).then(() => {
            this.getCustomerPriceLists();
          })
        }
        else {
          NotificationManager.error('Failed to Deleted Price Item', 'Error', 5000, () => {});
        }
      })
    }

  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updatePriceItem = (priceItem) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': this.state.currentlySelectedProductID,
        'ID': priceItem.ID
      },
      body: {
        'Price': priceItem.Price,
        'Lower_Range': priceItem.Lower_Range,
        'Upper_Range': priceItme.Upper_Range
      }
    };
    //this.setState({currentlySelectedCustomerID:id})
    API.put(customerAPI, '/'+id+'/price-list', apiRequest)
    .then(response => {
      //this.setState({currentlySelectedCustomer: JSON.parse(response.body)})
      console.log(JSON.parse(response.body))
    })
  }

  createPriceItem = (priceItem) => {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'product-id': this.state.currentlySelectedProductID
      },
      body: {
        'Price': priceItem.Price,
        'Lower_Range': priceItem.Lower_Range,
        'Upper_Range': priceItme.Upper_Range
      }
    };
    //this.setState({currentlySelectedCustomerID:id})
    API.post(customerAPI, '/'+id+'/price-list', apiRequest)
    .then(response => {
      //this.setState({currentlySelectedCustomer: JSON.parse(response.body)})
      console.log(JSON.parse(response.body))
    })
  }

  render() {
    return (
      <div>
        <section>
          
        </section>
      </div>
    );
  }
}
export default withRouter(ViewCustomers);
