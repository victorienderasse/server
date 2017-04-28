/**
 * Created by Victorien on 22-04-17.
 */

var userID = 1;
var total = 0.0;
var myProduct = [];

$(function(){

    $('#back').click(function(){
        redirectURL(serverURL+'/');
    });

    $('#confirm-select').click(function(){
        $('#purchase-select').slideToggle('slow');
        $('#purchase-bill').slideToggle('slow');
    });
    
    $('#continue-bill').click(function(){
        socket.emit('purchaseConfirm',{userID:userID, nbCamera: $('#nbCamera').val(), state:0});
        redirectURL(serverURL+'/display');
    });
    
    $('#confirm-bill').click(function(){
        var orderOK = true;
        if(orderOK){
            socket.emit('purchaseConfirm',{userID:userID, nbCamera: $('#nbCamera').val(), state:1});
        }else{
            displayMessage({title:'Alerte',message:'Erreur lors du paiement'});
        }
    });

    $('#purchaseList-btn').click(function(){
        socket.emit('getPurchase',userID);
    });

});

socket.emit('getProduct');

socket.on('getProductRes', function(tbProduct){
    displayProduct(tbProduct);
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
        myProduct[tbProduct[i].productID] = {
            amount:0,
            price:tbProduct[i].price
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
        var priceTXT = document.createTextNode(tbProduct[i].price+' €');

        //priceDiv.appendChild(priceTXT);
        price.appendChild(priceTXT);

        //STOCK
        var stock = document.createElement('td');
        var stockDiv = document.createElement('div');
        stockDiv.id = 'stock-product'+tbProduct[i].productID;
        var stockTXT;
        if(tbProduct[i].stock > 5){
            stock.setAttribute('style','color:#93E18C');
            stockTXT = document.createTextNode('Disponible');
        }else{
            if(tbProduct[i].stock > 0 && tbProduct[i].stock <= 5){
                stock.setAttribute('style','color:#C9AE89');
                stockTXT = document.createTextNode('Bientôt en rupture de stock');
            }else{
                stock.setAttribute('style','color:#AC3A3A');
                stockTXT = document.createTextNode('Indisponible');
            }
        }

        stockDiv.appendChild(stockTXT);
        stock.appendChild(stockDiv);

        //NB
        var nb = document.createElement('td');
        var nbDiv = document.createElement('div');
        nbDiv.id = 'nb-product'+tbProduct[i].productID;
        var nbInput = document.createElement('input');
        nbInput.type = 'number';
        nbInput.min = 0;
        nbInput.max = 20;
        nbInput.value = 0;
        nbInput.id = 'nb-product'+tbProduct[i].productID;
        nbInput.setAttribute('oninput','updateNB('+tbProduct[i].productID+',this.value);');

        nbDiv.appendChild(nbInput)
        nb.appendChild(nbDiv);

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
    var price = myProduct[productID].price;
    var oldValue = myProduct[productID].amount;
    var amount;
    console.log('oldValue: '+oldValue+' et value: '+value);
    if(parseInt(value) >= parseInt(oldValue)){
        console.log('ajout');
        amount = value - oldValue;
        myProduct[productID].amount = value;
        total = parseFloat(total) + (parseFloat(amount) * parseFloat(price));
    }else{
        console.log('soustrait');
        amount = oldValue - value;
        myProduct[productID].amount = value;
        total = parseFloat(total) - (parseFloat(amount) * parseFloat(price));
    }
    console.log('total before: '+total);
    total = Math.round(total*Math.pow(10,2))/Math.pow(10,2);
    console.log('total after: '+total);

    $('#total').text(total);

    var totalProduct = parseFloat(value) * parseFloat(price);
    $('#total-product'+productID).text(totalProduct+' €');

}


function updatePrice(value){
    $('#nbPrice').text(value+' x 50€');
    var price = value * 50;
    $('#sumPrice').text(price+'€');
}