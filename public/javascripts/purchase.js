/**
 * Created by Victorien on 22-04-17.
 */

var userID = 1;
var total = 0.0;

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

        //PRODUCT
        var product = document.createElement('tr');
        product.id = 'product'+tbProduct[i].productID;

        //IMAGE
        var imageTD = document.createElement('td');
        var image = document.createElement('img');
        image.src = '../images/logo.png';
        image.width = '250px';
        image.height = '150px';

        imageTD.appendChild(image);

        //NAME
        var name = document.createElement('td');
        var nameTXT = document.createTextNode(tbProduct[i].name);

        name.appendChild(nameTXT);

        //DESCIPTION
        var description = document.createElement('td');
        var descriptionTXT;
        if(tbProduct[i].stock > 5){
            description.setAttribute('style','color:#93E18C');
            descriptionTXT = document.createTextNode('Disponible');
        }else{
            if(tbProduct[i].stock > 0 && tbProduct[i].stock <= 5){
                description.setAttribute('style','color:#C9AE89');
                descriptionTXT = document.createTextNode('Bientôt en rupture de stock');
            }else{
                description.setAttribute('style','color:#AC3A3A');
                descriptionTXT = document.createTextNode('Indisponible');
            }
        }


        document.createTextNode(tbProduct[i].description);

        description.appendChild(descriptionTXT);

        //PRICE
        var price = document.createElement('td');
        price.id = 'price-product'+tbProduct[i].productID;
        var priceTXT = document.createTextNode(tbProduct[i].price+' €');
        price.appendChild(priceTXT);

        //STOCK
        var stock = document.createElement('td');
        var stockTXT = document.createTextNode(tbProduct[i].stock);
        stock.appendChild(stockTXT);

        //NB
        var nb = document.createElement('td');
        var nbInput = document.createElement('input');
        nbInput.type = 'number';
        nbInput.min = 0;
        nbInput.max = 20;
        nbInput.value = 0;
        nbInput.id = 'nb-product'+tbProduct[i].productID;
        nbInput.setAttribute('oninput','updateNB(this.value,'+i+');');

        nb.appendChild(nbInput);

        //TOTAL
        var total = document.createElement('td');
        total.id = 'total-product'+tbProduct[i].productID;
        var totalTXT = document.createTextNode('0.00 €');
        total.appendChild(totalTXT);


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


function updateNB(value,productID){
    console.log('updateNB function');
    var price = $('#price-product'+productID).text();
    var totalProduct = parseFloat(value) * parseFloat(price);
    total = total + totalProduct;
    $('#total').text(total);
    $('#total-product'+productID).text(totalProduct+' €');
}


function updatePrice(value){
    $('#nbPrice').text(value+' x 50€');
    var price = value * 50;
    $('#sumPrice').text(price+'€');
}