import React, { Component } from 'react';
import '../public/css/gridforms.css';



class ShippingAddress extends Component {
  constructor(props) {
    super(props);
  }


  handleNameChange = (event) => {
     this.props.update_courier_account_handler(this.props.id, event.target.value)
  }


  removeItem = (event) => {
	   event.preventDefault();
	   this.props.update_courier_account_handler(this.props.id, null)
  }

  onKeyPress = (event) => {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }


  render() {
    return (
      <div data-row-span="7">
         <div data-field-span="6">
           <label>Courier Account</label>
           <input type="text" value={this.props.name} id={this.props.id}  onChange={this.handleNameChange} />
         </div>
         <div data-field-span="1">
           <button onClick={this.removeItem}  >Remove Courier Account</button>
         </div>
      </div>
    );
  }
}

export default ShippingAddress;
