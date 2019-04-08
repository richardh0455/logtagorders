import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import ShippingAddress from './ShippingAddress';
import Select from 'react-select';

const customersAPI = 'CustomersAPI';
const updatePath = '/update';
const createPath = '/create';
const deletePath = '/delete';

class Customer extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      isUpdate:false,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {value:""},
      email: '',
      billing_address: '',
      shipping_addresses:[{ID:'0', ShippingAddress:'', created:true}],
      counter:'0',
      regions: [{value:"NZ", label: "New Zealand"},{value:"SA", label: "South America"},{value:"NA", label: "North America"},{value:"EU", label: "Europe"},{value:"AP", label: "Asia Pacific"},{value:"ME", label: "Middle East"}]
    };

    this.handleCustomerChange = this.handleCustomerChange.bind(this);
    this.handleRegionChange = this.handleRegionChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleBillingAddressChange = this.handleBillingAddressChange.bind(this);
    this.shippingAddressUpdated = this.shippingAddressUpdated.bind(this);
    this.addShippingAddress = this.addShippingAddress.bind(this);
    this.updateCustomer = this.updateCustomer.bind(this);
    this.createCustomer = this.createCustomer.bind(this);
    this.updateCustomerChangeHandler = this.updateCustomerChangeHandler.bind(this);
    this.createCustomerChangeHandler = this.createCustomerChangeHandler.bind(this);
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }


  async handleCustomerChange(event) {
	   this.setState({currentlySelectedCustomer: event})
     this.getCustomer(event.value).then(response => {
       var parsed_customer = JSON.parse(response.body);
       var contactInfo = parsed_customer.ContactInfo;
       var region =this.state.regions.find(region => region.value === contactInfo.Region);
       if(!region){
         region = {value:""}
       }
       var shippingAddresses = parsed_customer.ShippingAddresses
       if ( shippingAddresses === undefined || parsed_customer.ShippingAddresses.length == 0) {
         this.addShippingAddress();
       }

       this.setState({
         name: contactInfo.Name,
         currentlySelectedRegion: region,
         email: contactInfo.Contact_Email,
         billing_address: contactInfo.Billing_Address,
         shipping_addresses: parsed_customer.ShippingAddresses
       });
     })
  }

  async handleRegionChange(event) {
    this.setState({currentlySelectedRegion: event})
  }

  async handleNameChange(event) {
    this.setState({name: event.target.value})
  }

  async handleEmailChange(event) {
    this.setState({email: event.target.value})
  }

  async handleBillingAddressChange(event) {
    this.setState({billing_address: event.target.value})
  }

  async nameOnFocus() {
    if(this.state.name === 'Name' || this.state.name === '')
    {
      this.value = '';
    }
  }


  async updateCustomerEventHandler(e)
  {
    e.preventDefault();
    this.updateCustomer({customer_id:this.state.currentlySelectedCustomer.value, name:this.state.name, email:this.state.email, billing_address:this.state.billing_address, region:this.state.currentlySelectedRegion.value, shipping_addresses:this.state.shipping_addresses  });
  }

  async createCustomerEventHandler(e)
  {
    e.preventDefault();
    this.createCustomer({name:this.state.name, email:this.state.email, billing_address:this.state.billing_address, region:this.state.currentlySelectedRegion.value, shipping_addresses:this.state.shipping_addresses  });
  }

  async getCustomer(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(customersAPI, '/'+id, apiRequest)
  }

  async updateCustomer(customer)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"Name": customer.name, "EmailAddress": customer.email, "BillingAddress": customer.billing_address, "Region": customer.region}
    };
    API.post(customersAPI, '/'+customer.customer_id+updatePath, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      const shippingAddressSuccess = this.updateCustomerShippingAddresses(customer.customer_id, customer.shipping_addresses);
      if(parseInt(affectedRows, 10)==1 && shippingAddressSuccess)
      {
        NotificationManager.success('', 'Customer Successfully Updated', 5000);
        //Refresh Customer List
        this.props.get_all_customers();
      }
      else {
        NotificationManager.error('Creating Customer Shipping Addresses Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Updating Customer Failed', 'Error', 5000, () => {});
    })
  }

  async createCustomer(customer)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"Name": customer.name, "EmailAddress": customer.email, "BillingAddress": customer.billing_address, "Region": customer.region}
    };
    API.post(customersAPI, createPath, apiRequest)
    .then(response =>
    {
      var customerID = JSON.parse(JSON.parse(response.body))["CustomerID"];
      const success = this.createShippingAddresses(customerID, customer.shipping_addresses);
      if(success)
      {
        NotificationManager.success('', 'Customer Successfully Created', 5000);
        this.setState({
          billing_address:'',
          email:'',
          name:'',
          region:'',
          shipping_addresses:[],
          counter:'0'
        })
        //Refresh Customer List
        this.props.get_all_customers();
      }
      else {
        NotificationManager.error('Creating Customer Shipping Addresses Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Customer creation Failed', 'Error', 5000, () => {});
    })
  }

  async createShippingAddresses(customerID, shipping_addresses)
  {
    for(var index = 0; index < shipping_addresses.length; index++) {
      var result = await this.createShippingAddress(customerID, shipping_addresses[index].ShippingAddress);
      if(!result)
      {
        return false;
      }
    }
    return true;
  }

  async updateCustomerShippingAddresses(customerID, shipping_addresses)
  {
    for(var index = 0; index < shipping_addresses.length; index++) {
      if(shipping_addresses[index].created)
      {
        var result = await this.createShippingAddress(customerID, shipping_addresses[index].ShippingAddress);
        if(!result)
        {
          return false;
        }
      } else {
        var result = await this.updateShippingAddress(customerID,shipping_addresses[index].ID, shipping_addresses[index].ShippingAddress);
        if(!result)
        {
          return false;
        }

      }

    }
    return true;

  }

  async createShippingAddress(customerID, shipping_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"ShippingAddress": shipping_address}
    };
    const success = API.post(customersAPI, "/"+customerID+"/shipping-addresses/create", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Address creation Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async updateShippingAddress(customerID, shipping_address_id, shipping_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"ShippingAddress": shipping_address}
    };
    const success = API.post(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id+"/update", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Address updating Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async deleteShippingAddress(shipping_address_id) {
    var customerID = this.state.currentlySelectedCustomer.value
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.del(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id+deletePath, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      if(parseInt(affectedRows, 10)==1)
      {
        NotificationManager.success('', 'Shipping Address Deleted', 3000);

      }
      else {
        NotificationManager.error('Deleting Shipping Address Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Deleting Shipping Addres', 'Error', 5000, () => {});
    })
  }

  shippingAddressUpdated(key, item)
  {
     var addresses = this.state.shipping_addresses;
     for(var i = 0; i < addresses.length; i++) {

       if(addresses[i] && addresses[i].ID === key) {
         console.log('Found matching ID');
         if(item == null){
           this.deleteShippingAddress(addresses[i].ID)
           addresses.splice(i, 1);

         }
         else {
           addresses[i].ShippingAddress = item
         }
       }
     }
     this.setState({shipping_addresses: addresses});
  }

  addShippingAddress() {
    var key = Number(this.state.counter) + 1;
    var default_item = {ID:'0', ShippingAddress:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var shipping_addresses = this.state.shipping_addresses;
    shipping_addresses.push(cloneOfDefault);
    this.setState({counter: key, shipping_addresses: shipping_addresses });
  }

  createOrUpdate() {
    if(this.state.isUpdate){
      return (
        <div data-field-span="1" >
          <label>Customer</label>
          <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
      </div>);
    }
  }

  createCustomerChangeHandler() {
    this.setState({
      isUpdate:false,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {},
      email: '',
      billing_address: '',
      shipping_addresses:[]
    });
  }

  updateCustomerChangeHandler() {
    this.setState({
      isUpdate:true,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {},
      email: '',
      billing_address: '',
      shipping_addresses:[]

    });
  }

  getButtonText() {
    if(this.state.isUpdate){
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.updateCustomerEventHandler(e)} }>Update Customer</button>);
    }
    else {
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.createCustomerEventHandler(e)} }>Create Customer</button>);

    }

  }

  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
              <div data-row-span="2">
                <div className="radio">
                  <label>
                    <input type="radio" checked={!this.state.isUpdate} onChange={this.createCustomerChangeHandler} />
                    Create Customer
                  </label>

                  <label style={{marginLeft: 20 + 'px'}}>
                    <input type="radio" checked={this.state.isUpdate} onChange={this.updateCustomerChangeHandler} />
                    Update Customer
                  </label>
                </div>
                {this.createOrUpdate()}

              </div>
              <div data-row-span="2">
                <div data-field-span="1">
                  <label>Name</label>
                  <input type="text" value={this.state.name}  onChange={this.handleNameChange} />
                </div>
               <div data-field-span="1">
                 <label>Email</label>
                 <input type="text" value={this.state.email}  onChange={this.handleEmailChange} />
               </div>
             </div>
             <div data-row-span="2">
               <div data-field-span="1">
                 <label>Billing Address</label>
                 <input type="text" value={this.state.billing_address}  onChange={this.handleBillingAddressChange} />
               </div>
               <div data-field-span="1">
                 <label>Region</label>
                 <Select value={this.state.currentlySelectedRegion} onChange={this.handleRegionChange.bind(this)} options={this.state.regions} placeholder="Select a region"/>
               </div>
             </div>
           </fieldset>
           <fieldset>
             {this.state.shipping_addresses.map(address => (
             <ShippingAddress address={address} update_address_handler={this.shippingAddressUpdated} />
             ))}
             <button onClick={this.addShippingAddress}>Add Shipping Address</button>
           </fieldset>
           <div>
             {this.getButtonText()}
           </div>
         </form>
         <NotificationContainer/>
       </section>
     </div>
    );
  }
}

export default withRouter(Customer);
