import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import ShippingAddress from './ShippingAddress';
import CourierAccount from './CourierAccount';
import HSCode from './HSCode';
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
      billing_addresses:[{ID:'0', street:'',suburb:'',city:'',post_code:'', state:'',country:'', created:true}],
      shipping_addresses:[{ID:'0', street:'',suburb:'',city:'',post_code:'', state:'',country:'', created:true}],
      counter:'0',
      regions: [{value:"NA", label: "North America"},{value:"LATAM", label: "Latin America"},{value:"EMEA", label: "Europe, Middle East and Africa"},{value:"C", label: "Central"},{value:"A", label: "Asia"},{value:"OC", label: "Oceania"}],
      primary_contact_name:'',
      primary_contact_phone:'',
      primary_contact_fax:'',
      courier_accounts:[{ID:'0', created:true}],
      hs_codes:[{ID:'0', created:true}]
    };

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }


  handleCustomerChange = (event) => {
	   this.setState({currentlySelectedCustomer: event, customerDataRetrieved: false})
     this.getCustomer(event.value).then(response => {
       var parsed_customer = JSON.parse(response.body);
       var contactInfo = parsed_customer.ContactInfo;
       var region =this.state.regions.find(region => region.value === contactInfo.Region);
       if(!region){
         region = {value:""}
       }

       this.getShippingAddresses(event.value).then(response => {
         if(response != undefined || response.length != 0)
         {
          var parsed_addresses = response.map(address => {return {ID:address.ID, street:address.Street, suburb:address.Suburb, city: address.City, state:address.State, country: address.Country, post_code: address.PostCode}})
          this.setState({shipping_addresses: parsed_addresses});
        }
       })
       this.getBillingAddresses(event.value).then(response => {
        if(response != undefined || response.length != 0)
        {
          var parsed_addresses = response.map(address => {return {ID:address.ID, street:address.Street, suburb:address.Suburb, city: address.City, state:address.State, country: address.Country, post_code: address.PostCode}})
          this.setState({billing_addresses: parsed_addresses});
        }
       })

       var courierAccounts = parsed_customer.CourierAccounts.map(account => {return {AccountID:account.ID, AccountName : account.CourierAccount}})

       var hsCodes = parsed_customer.HSCodes.map(code => {return {ID: code.ID, HSCode : code.HSCode}})
       this.setState({
         name: contactInfo.Name,
         currentlySelectedRegion: region,
         email: contactInfo.Contact_Email,
         primary_contact_name: contactInfo.PrimaryContact.Name,
         primary_contact_phone: contactInfo.PrimaryContact.Phone,
         primary_contact_fax: contactInfo.PrimaryContact.Fax,
         courier_accounts: courierAccounts,
         hs_codes: hsCodes
       });
       this.setState({customerDataRetrieved: true})
     }).catch(err =>
     {
       console.log(err);

     })

  }

  handleRegionChange = (event) => {
    this.setState({currentlySelectedRegion: event})
  }

  handleNameChange = (event) => {
    this.setState({name: event.target.value})
  }

  handleEmailChange = (event) => {
    this.setState({email: event.target.value})
  }

  handlePrimaryContactNameChange = (event) => {
    this.setState({primary_contact_name: event.target.value})
  }

  handlePrimaryContactPhoneChange = (event) => {
    this.setState({primary_contact_phone: event.target.value})
  }

  handlePrimaryContactFaxChange = (event) => {
    this.setState({primary_contact_fax: event.target.value})
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
    this.updateCustomer(
      {
        customer_id: this.state.currentlySelectedCustomer.value,
        name: this.state.name,
        email: this.state.email,
        billing_addresses: this.state.billing_addresses,
        region: this.state.currentlySelectedRegion.value,
        shipping_addresses: this.state.shipping_addresses,
        primary_contact_name: this.state.primary_contact_name,
        primary_contact_phone: this.state.primary_contact_phone,
        primary_contact_fax: this.state.primary_contact_fax
      }
    );
  }

  async createCustomerEventHandler(e)
  {

    e.preventDefault();
    this.createCustomer(
      {
        name: this.state.name,
        email: this.state.email,
        billing_addresses: this.state.billing_addresses,
        region: this.state.currentlySelectedRegion.value,
        shipping_addresses: this.state.shipping_addresses,
        primary_contact_name: this.state.primary_contact_name,
        primary_contact_phone: this.state.primary_contact_phone,
        primary_contact_fax: this.state.primary_contact_fax
      }
    );
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


  updateCustomer = (customer) =>
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {
        "Name": customer.name,
        "EmailAddress": customer.email,
        "Region": customer.region,
        "PrimaryContact":{
            "Name":customer.primary_contact_name,
            "Phone":customer.primary_contact_phone,
            "Fax":customer.primary_contact_fax

        }
      }
    };
    API.post(customersAPI, '/'+customer.customer_id+updatePath, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      const shippingAddressSuccess = this.updateCustomerShippingAddresses(customer.customer_id, customer.shipping_addresses);
      const billingAddressSuccess = this.updateCustomerBillingAddresses(customer.customer_id, customer.billing_addresses);
      this.state.courier_accounts.map(
        account => {
          var accountID = account.AccountID;
          if(account.created) {
            this.createCourierAccount(customer.customer_id, account.AccountName)
            account.created=false;
          } else {
            this.updateCourierAccount(accountID, customer.customer_id, account.AccountName)
          }

        }
      )


      this.state.hs_codes.map(
        code  => {
          if(code.created) {
            this.createHSCode(customer.customer_id, code.HSCode)
            code.created = false;
          } else {
            this.updateHSCode(code.ID, customer.customer_id, code.HSCode)
          }
        }
      )
      if(parseInt(affectedRows, 10)==1 && shippingAddressSuccess)
      {
        NotificationManager.success('', 'Customer Successfully Updated', 3000);
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

  createCustomer = (customer) =>
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {
        "Name": customer.name,
        "EmailAddress": customer.email,
        "Region": customer.region,
        "PrimaryContact":{
            "Name":customer.primary_contact_name,
            "Phone":customer.primary_contact_phone,
            "Fax":customer.primary_contact_fax

        }
      }
    };
    API.post(customersAPI, createPath, apiRequest)
    .then(response =>
    {
      var customerID = JSON.parse(JSON.parse(response.body))["CustomerID"];
      const shippingAddressSuccess = this.createShippingAddresses(customerID, customer.shipping_addresses);
      const billingAddressSuccess = this.createBillingAddresses(customerID, customer.billing_addresses);
      this.state.courier_accounts.map(account => (
        this.createCourierAccount(customerID, account.AccountName)
      ))
      this.state.hs_codes.map(
        code  => {
            this.createHSCode(customerID, code.HSCode)
        }
      )

      if(shippingAddressSuccess && billingAddressSuccess)
      {
        NotificationManager.success('', 'Customer Successfully Created', 3000);
        this.resetInputFields()
        //Refresh Customer List
        this.props.get_all_customers();
      }
      else {
        NotificationManager.error('Creating Customer Addresses Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Customer creation Failed', 'Error', 5000, () => {});
    })
  }

  async getShippingAddresses(customerID)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return API.get(customersAPI, "/"+customerID+"/shipping-addresses", apiRequest)
    .then(response =>
    {
      return JSON.parse(response.body);
    })
    .catch(err =>
    {
      NotificationManager.error('Address creation Failed', 'Error', 5000, () => {});
      return false;
    })
  }

  async getBillingAddresses(customerID)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return API.get(customersAPI, "/"+customerID+"/billing-addresses", apiRequest)
    .then(response =>
    {
      return JSON.parse(response.body);
    })
    .catch(err =>
    {
      NotificationManager.error('Address creation Failed', 'Error', 5000, () => {});
      return false;
    })
  }

  async createShippingAddresses(customerID, shipping_addresses)
  {
    for(var index = 0; index < shipping_addresses.length; index++) {
      var result = await this.createShippingAddress(customerID, shipping_addresses[index]);
      if(!result)
      {
        return false;
      }
    }
    return true;
  }

  async createBillingAddresses(customerID, billing_addresses)
  {
    for(var index = 0; index < billing_addresses.length; index++) {
      var result = await this.createBillingAddress(customerID, billing_addresses[index]);
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
        var result = await this.createShippingAddress(customerID, shipping_addresses[index]);
        if(!result)
        {
          return false;
        }
        shipping_addresses[index].created = false;
      } else {
        var result = await this.updateShippingAddress(customerID,shipping_addresses[index].ID, shipping_addresses[index]);
        if(!result)
        {
          return false;
        }

      }

    }
    return true;

  }

  async updateCustomerBillingAddresses(customerID, billing_addresses)
  {
    for(var index = 0; index < billing_addresses.length; index++) {
      if(billing_addresses[index].created)
      {
        var result = await this.createBillingAddress(customerID, billing_addresses[index]);
        if(!result)
        {
          return false;
        }
        billing_addresses[index].created = false;
      } else {
        var result = await this.updateBillingAddress(customerID,billing_addresses[index].ID, billing_addresses[index]);
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
      body:{"Street": shipping_address.street,
        "Suburb" : shipping_address.suburb,
        "City": shipping_address.city,
        "State": shipping_address.state,
        "Country": shipping_address.country,
        "PostCode":shipping_address.post_code
      }
    };
    const success = API.post(customersAPI, "/"+customerID+"/shipping-addresses", apiRequest)
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

  async createBillingAddress(customerID, billing_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"Street": billing_address.street,
        "Suburb" : billing_address.suburb,
        "City": billing_address.city,
        "State": billing_address.state,
        "Country": billing_address.country,
        "PostCode":billing_address.post_code
      }
    };
    const success = API.post(customersAPI, "/"+customerID+"/billing-addresses", apiRequest)
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
      body:{"Street": shipping_address.street,
        "Suburb" : shipping_address.suburb,
        "City": shipping_address.city,
        "State": shipping_address.state,
        "Country": shipping_address.country,
        "PostCode":shipping_address.post_code
      }
    };
    const success = API.put(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id, apiRequest)
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

  async updateBillingAddress(customerID, billing_address_id, billing_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"Street": billing_address.street,
        "Suburb" : billing_address.suburb,
        "City": billing_address.city,
        "State": billing_address.state,
        "Country": billing_address.country,
        "PostCode":billing_address.post_code
      }
    };
    const success = API.put(customersAPI, "/"+customerID+"/billing-addresses/"+billing_address_id, apiRequest)
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
    if(!customerID || !shipping_address_id) {
      return ;
    }
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.del(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id, apiRequest)
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
      NotificationManager.error('Deleting Shipping Address', 'Error', 5000, () => {});
    })
  }

  async deleteBillingAddress(billing_address_id) {

    var customerID = this.state.currentlySelectedCustomer.value
    if(!customerID || !billing_address_id) {
      return ;
    }
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.del(customersAPI, "/"+customerID+"/billing-addresses/"+billing_address_id, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      if(parseInt(affectedRows, 10)==1)
      {
        NotificationManager.success('', 'Billing Address Deleted', 3000);

      }
      else {
        NotificationManager.error('Deleting Billing Address Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Deleting Billing Address', 'Error', 5000, () => {});
    })
  }

  shippingAddressUpdated = (id, field, value) =>
  {
     var addresses = this.state.shipping_addresses;
     for(var i = 0; i < addresses.length; i++) {
       if(addresses[i] && addresses[i].ID === id) {
         if(field === 'deleted'){
           if(!addresses[i].created){
             this.deleteShippingAddress(addresses[i].ID)
           }

           addresses.splice(i, 1);

         }
         else {
           addresses[i][field] = value
         }
       }
     }
     this.setState({shipping_addresses: addresses});
  }

  billingAddressUpdated = (id, field, value) =>
  {
     var addresses = this.state.billing_addresses;
     for(var i = 0; i < addresses.length; i++) {
       if(addresses[i] && addresses[i].ID === id) {
         if(field === 'deleted'){
           if(!addresses[i].created){
             this.deleteBillingAddress(addresses[i].ID)
           }

           addresses.splice(i, 1);

         }
         else {
           addresses[i][field] = value
         }
       }
     }
     this.setState({billing_addresses: addresses});
  }

  async createCourierAccount(customerID, accountName)
  {
    var body = {"CourierAccount": accountName}
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.post(customersAPI, "/"+customerID+"/courier-accounts", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Courier Account creation Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async updateCourierAccount(accountID, customerID, accountName)
  {
    var body = {
      "CourierAccount": accountName,
      "AccountID": accountID
    }

    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.put(customersAPI, "/"+customerID+"/courier-accounts", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Courier Account Updating Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async deleteCourierAccount(accountID, customerID)
  {
    var body = {
      "AccountID": accountID
    }

    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.del(customersAPI, "/"+customerID+"/courier-accounts", apiRequest)
    .then(response =>
    {
      NotificationManager.success('', 'Courier Account Deleted', 3000);
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Courier Account Deleting Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  courierAccountUpdated = (key, item) =>
  {
     var accounts = this.state.courier_accounts;
     for(var i = 0; i < accounts.length; i++) {

       if(accounts[i] && accounts[i].AccountID === key) {
         if(item == null){
           if(!accounts[i].created){
             this.deleteCourierAccount(accounts[i].AccountID, this.state.currentlySelectedCustomer.value)
           }

           accounts.splice(i, 1);

         }
         else {
           accounts[i].AccountName = item
         }
       }
     }
     this.setState({courier_accounts: accounts});
  }

  hsCodeUpdated = (key, item) =>
  {
     var codes = this.state.hs_codes;
     for(var i = 0; i < codes.length; i++) {

       if(codes[i] && codes[i].ID === key) {
         if(item == null){
           if(!codes[i].created){
             this.deleteHSCode(codes[i].ID, this.state.currentlySelectedCustomer.value)
           }

           codes.splice(i, 1);

         }
         else {
           codes[i].HSCode = item
         }
       }
     }
     this.setState({hs_codes: codes});
  }

  async createHSCode(customerID, hsCode)
  {
    var body = {"HSCode": hsCode}
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.post(customersAPI, "/"+customerID+"/hs-codes", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('HS Code creation Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async updateHSCode(id, customerID, hsCode)
  {
    var body = {
      "HSCode": hsCode,
      "ID": id
    }

    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.put(customersAPI, "/"+customerID+"/hs-codes", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('HS Codes Updating Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async deleteHSCode(id, customerID)
  {
    var body = {
      "ID": id
    }

    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: body
    };
    const success = API.del(customersAPI, "/"+customerID+"/hs-codes", apiRequest)
    .then(response =>
    {
      NotificationManager.success('', 'HS Code Deleted', 3000);
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('HS Code Deleting Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  addShippingAddress = (e) => {
    try{
      e.preventDefault();
    } catch (error) {
      //Some events have no default. Expected behavior
    }
    var key = Number(this.state.counter) + 1;
    var default_item = {ID:'0', street:'',suburb:'',city:'',post_code:'',state:'',country:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var shipping_addresses = this.state.shipping_addresses;
    shipping_addresses.push(cloneOfDefault);
    this.setState({counter: key, shipping_addresses: shipping_addresses });
  }

  addBillingAddress = (e) => {
    try{
      e.preventDefault();
    } catch (error) {
      //Some events have no default. Expected behavior
    }
    var key = Number(this.state.counter) + 1;
    var default_item = {ID:'0', street:'',suburb:'',city:'',post_code:'',state:'',country:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var billing_addresses = this.state.billing_addresses;
    billing_addresses.push(cloneOfDefault);
    this.setState({counter: key, billing_addresses: billing_addresses });
  }

  addCourierAccount = (e) => {
    try{
      e.preventDefault();
    } catch (error) {
      //Some events have no default. Expected behavior
    }
    var key = Number(this.state.counter) + 1;
    var default_item = {AccountID:key, AccountName:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var courier_accounts = this.state.courier_accounts;
    courier_accounts.push(cloneOfDefault);
    this.setState({counter: key, courier_accounts: courier_accounts });
  }

  addHSCode = (e) => {
    try{
      e.preventDefault();
    } catch (error) {
      //Some events have no default. Expected behavior
    }
    var key = Number(this.state.counter) + 1;
    var default_item = {ID:key, HsCode:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var hs_codes = this.state.hs_codes;
    hs_codes.push(cloneOfDefault);
    this.setState({counter: key, hs_codes: hs_codes });
  }

  removeCourierAccount = (e) => {
    e.preventDefault()
    console.log(e.target)

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

  resetInputFields() {
    this.setState({
      customerDataRetrieved: false,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {},
      email: '',
      billing_addresses:[{ID:'0', street:'',suburb:'',city:'',post_code:'', state:'',country:'', created:true}],
      shipping_addresses:[{ID:'0', street:'',suburb:'',city:'',post_code:'', state:'',country:'', created:true}],
      primary_contact_name:'',
      primary_contact_phone:'',
      primary_contact_fax:'',
      courier_accounts:[{ID:'0', AccountName:'', created:true}],
      hs_codes:[{ID:'0', HSCode:'', created:true}],
    });

  }

  createCustomerChangeHandler = () => {
    this.resetInputFields();
    this.setState({isUpdate:false})
  }

  updateCustomerChangeHandler = () => {
    this.resetInputFields();
    this.setState({isUpdate:true})

  }



  getButtonText() {
    if(this.state.isUpdate){
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.updateCustomerEventHandler(e)} }>Update Customer</button>);
    }
    else {
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.createCustomerEventHandler(e)} }>Create Customer</button>);

    }

  }

  renderDetailFields() {
    return (
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
         <label>Region</label>
         <Select value={this.state.currentlySelectedRegion} onChange={this.handleRegionChange.bind(this)} options={this.state.regions} placeholder="Select a region"/>
       </div>
     </div>
     <div data-row-span="3">
       <div data-field-span="1">
         <label>Primary Contact Name</label>
         <input type="text" value={this.state.primary_contact_name}  onChange={this.handlePrimaryContactNameChange} />
       </div>
       <div data-field-span="1">
         <label>Phone Number</label>
         <input type="text" value={this.state.primary_contact_phone}  onChange={this.handlePrimaryContactPhoneChange} />
       </div>
       <div data-field-span="1">
         <label>Fax Number</label>
         <input type="text" value={this.state.primary_contact_fax}  onChange={this.handlePrimaryContactFaxChange} />
       </div>
     </div>
     <fieldset>
      <label>Billing Address</label>
      {this.state.billing_addresses.map(address => (
        <ShippingAddress street={address.street} suburb={address.suburb} city={address.city} post_code={address.post_code} state={address.state} country={address.country} id={address.ID} update_address_handler={this.billingAddressUpdated} />
      ))}
      <button onClick={this.addBillingAddress}>Add Billing Address</button>
     </fieldset>

     <fieldset>
       <label>Shipping Addresses</label>
       {this.state.shipping_addresses.map(address => (
       <ShippingAddress street={address.street} suburb={address.suburb} city={address.city} post_code={address.post_code} state={address.state} country={address.country} id={address.ID} update_address_handler={this.shippingAddressUpdated} />
       ))}

       <button onClick={this.addShippingAddress}>Add Shipping Address</button>
     </fieldset>
     <fieldset>
       <label>Courier Accounts</label>
       {this.state.courier_accounts.map(account => (
         <CourierAccount name={account.AccountName} id={account.AccountID} update_courier_account_handler={this.courierAccountUpdated}/>
       ))}
       <button onClick={this.addCourierAccount}>Add Courier Account</button>
     </fieldset>

     <fieldset>
       <label>HS Codes</label>
       {this.state.hs_codes.map(code => (
         <HSCode name={code.HSCode} id={code.ID} update_hs_code_handler={this.hsCodeUpdated}/>
       ))}
       <button onClick={this.addHSCode}>Add HS Code</button>
     </fieldset>

     <div>
       {this.getButtonText()}
     </div>
     </fieldset>

    )

  }
  createCustomerChoice = () => {
    this.setState({firstChoiceMade: true})
  }

  updateCustomerChoice = () => {
    this.setState({firstChoiceMade: true, isUpdate: true})
  }



  renderOperationChoices() {
    if(!this.state.firstChoiceMade){
      return (
        <div>
          <button onClick={this.createCustomerChoice}>Create Customer</button>
          <button onClick={this.updateCustomerChoice}>Update Customer</button>
        </div>
        )
    } else if(!this.state.isUpdate) {
      return (
        <div>
          {this.renderDetailFields()}
        </div>
      )
    } else if(!this.state.customerDataRetrieved) {
      return (
        <div>
          {this.createOrUpdate()}
        </div>
      )
    } else {
      return (
        <div>
          {this.renderDetailFields()}
        </div>
      )

    }

  }

  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
              {this.renderOperationChoices()}
         </form>
       </section>
     </div>
    );
  }
}

export default withRouter(Customer);
