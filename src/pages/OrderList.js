import React, { Component } from 'react';
import OrderItem from './OrderItem';
import '../public/css/gridforms.css';
import * as jsPDF from 'jspdf';
import * as Base64 from 'base-64';
import logo from '../public/images/LTLogo.png';




class OrderList extends Component {
	constructor(props) {
    super(props);
	this.state = {
		counter: /*localStorage.getItem('counter') ? localStorage.getItem('counter') :*/ '5',
		order_items: /*localStorage.getItem('order_items') ? JSON.parse(localStorage.getItem('order_items')) :*/ []

	};

    this.removeItem = this.removeItem.bind(this);
    this.orderItemUpdated = this.orderItemUpdated.bind(this);
    this.addItem = this.addItem.bind(this);
    this.generatePDF = this.generatePDF.bind(this);
    this.saveOrderAndGeneratePDF = this.saveOrderAndGeneratePDF.bind(this);


	}

    async componentDidMount() {
	  if (this.state.order_items === undefined || this.state.order_items.length == 0)
	  {
		this.addOrderLine()
	  }
    }




	buildInvoiceBody() {
		var lines =[]
		var items = this.state.order_items;
		for(var i = 0; i < items.length; i++) {
			var item = items[i];
			var variant_id = 0;
			if(item.variant_id === -1) {
				variant_id = 'NULL';
			}

			lines.push({"ProductID":item.product_id, "VariationID": item.variant_id, "Quantity": item.quantity, "Price":item.price});
		}
		return lines;
	}

   removeItem(key) {
	  var items = this.state.order_items;
	  for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			items.splice(i, 1);
		}
	  }
	  this.saveState({order_items: items});
   }

   addItem(event) {
	event.preventDefault();
	this.addOrderLine();

   }

  addOrderLine() {
	  var key = Number(this.state.counter) + 1;
 	  var default_item = {key:'0', product_name:'Select a Product', product_id:"-1", variant:'No Variant', variant_id:'0', quantity:'0', price:'0'};
	  var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
	  cloneOfDefault.key = key;
	  var items = this.state.order_items;
	  items.push(cloneOfDefault);
	  this.saveState({counter: key, order_items: items });
  }


   saveState(state) {
	this.setState(state)
   }

   calculateTotal(subtotals) {
	  var items = this.state.order_items;
	  var total = 0;
	  for(var i = 0; i < items.length; i++) {
		total += items[i].quantity * items[i].price;
	  }
	  return total;
   }

   orderItemUpdated(key, item) {
	   var items = this.state.order_items;
	   for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			if(item == null){
				items.splice(i, 1);
			}else {
				items[i] = {...items[i], ...item}
			}
		}
	  }
	  this.saveState({order_items: items});
   }


  generatePDF() {
	var doc = new jsPDF();
	var initX = 15;
	var initY = 50;

	doc.setFillColor(6,46,112);
	doc.rect(5, 5, 200, 20, 'F');
	doc.addImage(logo , 'PNG', 7, 7, 100, 10);

	doc.text('Logtag Order #0569023', 15, 35);
	var items = this.state.order_items;
	doc.text('Product', initX, initY);
	doc.text('Variation', initX+44, initY);
	doc.text('Price', initX+90, initY);
	doc.text('Quantity', initX+120, initY);
	doc.text('Subtotal', initX+144, initY);
	doc.line(initX, initY+5, initX+180, initY+5);
	initY += 20;
	for(var i = 0; i < items.length; i++) {
		doc.text(doc.splitTextToSize(items[i].product_name, 40), initX, initY);
		doc.text(doc.splitTextToSize(items[i].variant.replace(',',', \n'), 36), initX+44, initY);
		doc.text(items[i].price, initX+90, initY);
		doc.text(items[i].quantity, initX+120, initY);
		doc.text(items[i].quantity*items[i].price+'', initX+144, initY);
		doc.line(initX, initY+15, initX+180, initY+15);
		initY += 25;

	}
	doc.text('Total: '+this.calculateTotal(), initX, initY);
	doc.save('Order.pdf')

   }

   saveOrderAndGeneratePDF(event) {
	   event.preventDefault();
		 if (window.confirm('Are you sure?')) {
	     this.generatePDF();
	     this.props.create_invoice_handler(this.buildInvoiceBody());
	   }
   }


   render() {
    return (
	<div className = "OrderList">

      <fieldset>
		{this.state.order_items.map(item => (
			<OrderItem key={item.key} item={item} products={this.props.products} update_item_handler={this.orderItemUpdated} customer={this.props.customer}/>
		))}


	  </fieldset>

	  <button onClick={this.addItem}>Add Product</button>

	  <div>
		<strong>Total: {this.calculateTotal()}</strong>
	  </div>

	  <div>
		<button onClick={this.saveOrderAndGeneratePDF}>Generate PDF</button>
	  </div>
	</div>

    );
  }
}

export default OrderList;
