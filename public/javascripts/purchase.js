/**
 * Created by Victorien on 22-04-17.
 */

var userID = 1;
var total = 0.0;
var myProduct = [];
var orderID;

$(function(){

    $('#back').click(function(){
        redirectURL(serverURL+'/');
    });

    $('#confirm-order').click(function(){
        displayOrder();
        $('#order-bill').slideToggle('slow');
        $('#product-list').slideToggle('slow');
    });
    
    $('#continue-bill').click(function(){
        $('#order-bill').slideToggle('slow');
        $('#product-list').slideToggle('slow');
        var order = document.getElementById('order');
        while(order.firstChild){
            order.removeChild(order.firstChild);
        }
    });
    
    $('#confirm-bill').click(function(){
        
        socket.emit('addOrder',{userID:userID, order:myProduct});
        
    });

    $('#orderList-btn').click(function(){
        socket.emit('getOrder',userID);
    });

    $('#buy-confirm').click(function(){
        var buy = true;
        if(buy){
            socket.emit('orderPaid',orderID);
        }else{
            displayMessage({title:'Alerte', message:'Erreur paiement'});
        }
    });
    
    $('#buy-later').click(function(){
        redirectURL(serverURL+'/display');
    });

});

socket.emit('getProduct');

socket.on('getProductRes', function(tbProduct){
    displayProduct(tbProduct);
});


socket.on('addOrderRes', function(id){
    console.log('addOrderRes event');
    orderID = id;
    $('#order-bill').toggle('slow');
    $('#buy-interface').toggle('slow');
});


socket.on('getOrderRes', function(tbOrder){
    console.log('getOrderRes event');
    console.log('orderID: '+tbOrder[0].orderID+' et nbProduct: '+tbOrder[0].nbProduct);
});


socket.on('getPurchaseRes', function(tbPurchase){
    console.log('getPurchaseRes event');
    var purchaseList = $('#table-purchase-list');
    for(var i=0;i<tbPurchase.length;i++){

        //PURCHASE
        var purchase = document.createElement('tr');
        purchase.id = 'purchase'+tbPurchase[i].purchaseID;
        purchase.className = 'purchase';

        //PRODUCT
        var product = document.createElement('td');

        //AMOUNT
        var amount = document.createElement('td');

        //UNIT PRICE
        var unitPrice = document.createElement('td');

        //TOTAL
        var total = document.createElement('td');

        //STATE
        var state = document.createElement('td');

        //DATE
        var date = document.createElement('td');

        //BTN
        var btn = document.createElement('td');
        if(tbPurchase[i].state == 0){
            var removeBtn = document.createElement('button');
            var editBtn = document.createElement('button');
        }




        purchase.appendChild(product);
        purchase.appendChild(amount);
        purchase.appendChild(unitPrice);
        purchase.appendChild(total);
        purchase.appendChild(state);
        purchase.appendChild(date);
        purchase.appendChild(btn);

    }
});


function displayProduct(tbProduct){

    console.log('displayProduct function');
    var tableProduct = document.getElementById('table-product-list');

    for(var i=0;i<tbProduct.length;i++){

        //MY PRODUCT
        myProduct[i] = {
            amount:0,
            price:tbProduct[i].price,
            stock: tbProduct[i].stock,
            name:tbProduct[i].name,
            productID:tbProduct[i].productID
        };

        //PRODUCT
        var product = document.createElement('tr');
        product.id = 'product'+tbProduct[i].productID;

        //IMAGE
        var imageTD = document.createElement('td');
        var imageDiv = document.createElement('div');
        imageDiv.id = 'image-div-product'+tbProduct[i].productID;
        var image = document.createElement('img');
        image.src = '../images/logo.png';
        image.setAttribute('style','width:250px; height:150px;');

        imageDiv.appendChild(image);
        imageTD.appendChild(imageDiv);

        //NAME
        var name = document.createElement('td');
        var nameDiv = document.createElement('div');
        nameDiv.id = 'name-product'+tbProduct[i].productID;
        var nameTXT = document.createTextNode(tbProduct[i].name);

        nameDiv.appendChild(nameTXT);
        name.appendChild(nameDiv);

        //DESCIPTION
        var description = document.createElement('td');
        var descriptionDiv = document.createElement('div');
        descriptionDiv.id = 'description-product'+tbProduct[i].productID;
        var descriptionTXT= document.createTextNode(tbProduct[i].description);

        descriptionDiv.appendChild(descriptionTXT);
        description.appendChild(descriptionDiv);

        //PRICE
        var price = document.createElement('td');
        var priceDiv = document.createElement('div');
        price.id = 'price-product'+tbProduct[i].productID;
        var myPrice = (tbProduct[i].price).toFixed(2);
        var priceTXT = document.createTextNode(myPrice+' €');

        //priceDiv.appendChild(priceTXT);
        price.appendChild(priceTXT);

        //NB
        var nb = document.createElement('td');
        var nbDiv = document.createElement('div');
        nbDiv.id = 'nb-product'+tbProduct[i].productID;
        var nbInput = document.createElement('input');
        nbInput.className = 'form-control';
        nbInput.type = 'number';
        nbInput.min = 0;
        nbInput.max = tbProduct[i].stock;
        nbInput.value = 0;
        nbInput.id = 'nb-product'+tbProduct[i].productID;
        nbInput.setAttribute('oninput','updateNB('+tbProduct[i].productID+',this.value);');

        nbDiv.appendChild(nbInput);
        nb.appendChild(nbDiv);


        //STOCK
        var stock = document.createElement('td');
        var stockDiv = document.createElement('div');
        stockDiv.id = 'stock-product'+tbProduct[i].productID;
        var stockTXT;
        if(tbProduct[i].stock > 5){
            stockDiv.setAttribute('style','color:#37643D');
            stockTXT = document.createTextNode('Disponible');
        }else{
            if(tbProduct[i].stock > 0 && tbProduct[i].stock <= 5){
                stockDiv.setAttribute('style','color:#C9AE89');
                stockTXT = document.createTextNode('Bientôt en rupture de stock');
            }else{
                stockDiv.setAttribute('style','color:#AC3A3A');
                stockTXT = document.createTextNode('Indisponible');
            }
        }

        stockDiv.appendChild(stockTXT);
        stock.appendChild(stockDiv);


        //TOTAL
        var total = document.createElement('td');
        var totalDiv = document.createElement('div');
        totalDiv.id = 'total-product'+tbProduct[i].productID;
        var totalTXT = document.createTextNode('0.00 €');

        totalDiv.appendChild(totalTXT);
        total.appendChild(totalDiv);


        product.appendChild(imageTD);
        product.appendChild(name);
        product.appendChild(description);
        product.appendChild(price);
        product.appendChild(stock);
        product.appendChild(nb);
        product.appendChild(total);

        tableProduct.appendChild(product);

    }
}


function updateNB(productID, value){
    console.log('updateNB function');
    for(var i=0;i<myProduct.length;i++){
        if(myProduct[i].productID == productID){
            ind = i;
        }
    }
    var price = myProduct[ind].price;
    var oldValue = myProduct[ind].amount;
    var amount,ind;
    console.log('oldValue: '+oldValue+' et value: '+value);
    if(parseInt(value) >= parseInt(oldValue)){
        console.log('ajout');
        amount = value - oldValue;
        total = parseFloat(total) + (parseFloat(amount) * parseFloat(price));
        myProduct[ind].stock = parseInt(myProduct[ind].stock) - parseInt(amount);
    }else{
        console.log('soustrait');
        amount = oldValue - value;
        total = parseFloat(total) - (parseFloat(amount) * parseFloat(price));
        myProduct[ind].stock = parseInt(myProduct[ind].stock) + parseInt(amount);
    }

    total = (Math.round(total*Math.pow(10,2))/Math.pow(10,2)).toFixed(2);


    $('#total').text(total);

    var totalProduct = (parseFloat(value) * parseFloat(price)).toFixed(2);
    $('#total-product'+productID).text(totalProduct+' €');

    var stock = document.getElementById('stock-product'+productID);
    if(myProduct[ind].stock > 5){
        stock.innerHTML = 'Disponible';
        stock.setAttribute('style','color:#37643D');
    }else{
        if (myProduct[ind].stock >0){
            stock.innerHTML = 'Bientôt en rupture de stock';
            stock.setAttribute('style','color:#C9AE89');
        }else{
            stock.innerHTML = 'Indisponible';
            stock.setAttribute('style','color:#AC3A3A');
        }
    }

    myProduct[ind].amount = value;

}


function displayOrder(){

    var order = document.getElementById('order');
    var tot = 0.0;

    for(var i=0; i<myProduct.length;i++){
        if(myProduct[i].amount > 0){

            tot = (tot + (parseFloat(myProduct[i].amount) * parseFloat(myProduct[i].price)));

            //NAME
            var nameDiv = document.createElement('div');
            nameDiv.className = 'col-lg-3 col-lg-offset-1';
            nameDiv.setAttribute('style','font-size:20px;text-align:left;');
            var name = document.createTextNode(myProduct[i].name);

            nameDiv.appendChild(name);

            //NB
            var nbDiv = document.createElement('div');
            nbDiv.className = 'col-lg-4';
            nbDiv.setAttribute('style','font-size:15px; font-weight:lighter;');
            var nb = document.createTextNode(myProduct[i].amount+' x '+myProduct[i].price.toFixed(2)+' €');

            nbDiv.appendChild(nb);

            //TOTALPRODUCT
            var totalProductDiv = document.createElement('div');
            totalProductDiv.className = 'col-lg-4';
            totalProductDiv.setAttribute('style','font-size:20px; font-weight:bold;');
            var totalProduct = document.createTextNode((parseFloat(myProduct[i].amount) * parseFloat(myProduct[i].price)).toFixed(2)+' €');

            totalProductDiv.appendChild(totalProduct);

            //PURCHASE
            var purchase = document.createElement('div');
            purchase.className = 'row';
            purchase.setAttribute('style','height:75px;');

            purchase.appendChild(nameDiv);
            purchase.appendChild(nbDiv);
            purchase.appendChild(totalProductDiv);

            order.appendChild(purchase);

        }
    }

    var hr = document.createElement('hr');

    var totalDiv = document.createElement('div');
    totalDiv.className = 'row col-lg-offset-8';
    totalDiv.setAttribute('style','font-size:30px; font-weight:bolder; margin-bottom:20px;');
    var total = document.createTextNode('Total: '+tot.toFixed(2)+' €');
    totalDiv.appendChild(total);

    order.appendChild(hr);
    order.appendChild(totalDiv);

}