import React, { Component } from 'react';
import '../public/css/gridforms.css';



class ShippingAddress extends Component {
  constructor(props) {
    super(props);
  //var shippingAddressLines = this.props.address.split(',').map(address => address.trim())

  }


  handleStreetChange = (event) => {
	   //this.props.address1 = event.target.value
     this.props.update_address_handler(this.props.id, 'street',event.target.value)
  }
  handleSuburbChange = (event) => {
	   //this.props.address2 = event.target.value
     this.props.update_address_handler(this.props.id, 'suburb',event.target.value)
  }
  handleCityChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'city',event.target.value)
  }
  handlePostCodeChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'post_code',event.target.value)
  }
  handleStateChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'state',event.target.value)
  }
  handleCountryChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'country',event.target.value)
  }



  //}

  removeItem = (event) => {
	event.preventDefault();
	this.props.update_address_handler(this.props.id, null)
  }

  onKeyPress = (event) => {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }


  render() {
    return (
      <div className onKeyPress={this.onKeyPress}>
      <div data-row-span="9">
			<div data-field-span="2">
				<label>Street</label>
				<input type="text" value={this.props.street} onChange={this.handleStreetChange} />
			</div>
      <div data-field-span="2">
				<label>Suburb</label>
				<input type="text" value={this.props.suburb}  onChange={this.handleSuburbChange}/>
			</div>
      <div data-field-span="1">
				<label>City</label>
				<input type="text" value={this.props.city}  onChange={this.handleCityChange}/>
			</div>
      <div data-field-span="1">
				<label>State</label>
				<input type="text" value={this.props.state}  onChange={this.handleStateChange}/>
			</div>
      <div data-field-span="1">
				<label>Country</label>
				<input type="text" value={this.props.country}  onChange={this.handleCountryChange}/>
			</div>
      <div data-field-span="1">
				<label>Postal Code</label>
				<input type="text" value={this.props.post_code} onChange={this.handlePostCodeChange} />
			</div>
			<div data-field-span="1">
				<button onClick={this.removeItem}  >Remove Item</button>
			</div>
		</div>
	  </div>
    );
  }
}

export default ShippingAddress;
