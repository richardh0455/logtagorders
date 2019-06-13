import React, { Component } from 'react';
import '../../public/css/gridforms.css';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';


class PriceItem extends Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }


  handleLowerRangeChange = (event) => {
  this.props.item.lower_range = event.target.value;
  this.props.update_item_handler(this.props.item.ID, this.props.item)
  }

  handleUpperRangeChange = (event) => {
  this.props.item.upper_range = event.target.value;
  this.props.update_item_handler(this.props.item.ID, this.props.item)
  }

  handlePriceChange = (event) => {
    var price = event.target.value.replace('$', '').trim()
    this.props.item.price = price;
    this.props.update_item_handler(this.props.item.ID, this.props.item)
  }



  removeItem = (event) => {
	event.preventDefault();
  this.props.delete_price_item(this.props.item.ID);
  }




  onKeyPress = (event) => {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }

  render() {
    return (
      <div className onKeyPress={this.onKeyPress}>
        <div data-row-span="3">
			<div data-field-span="1">
				<label>Lower Range</label>
				<input type="text" value={this.props.item.lower_range} onChange={this.handleLowerRangeChange} />
			</div>
			<div data-field-span="1">
				<label>Upper Range</label>
				<input type="text" value={this.props.item.upper_range} onChange={this.handleUpperRangeChange} />
			</div>
			<div data-field-span="1">
				<label>Price</label>
				<input type="text" value={this.props.item.price} onChange={this.handlePriceChange} />
			</div>

			<div data-field-span="1">
				<button onClick={this.removeItem}  >Remove Item</button>
			</div>

		</div>
	  </div>
    );
  }
}

export default PriceItem;
