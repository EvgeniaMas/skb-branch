Simple Cart Shop
================
Базовый функционал корзины сайта. 

### Описание
Товары внутри корзины хранятся одномерным массивом. Если структура требует дополнительной вложенности,
то необходимо использовать метод `formatToSave()` для форматирования перед сохранением в cookie,
и обратный ему `formatToWork()` для преобразования данных из cookie.



### Подключение
Для работы библиотеки необходимо подключить на страницу две зависимости: jQuery и [JS Cookie](https://github.com/js-cookie/js-cookie). 
```sh
# NPM
npm install simple-cart-shop
```
Инициализировать корзину можно следующим способом
``` sh
new Cart(options).init();
```

### Настройки

| Параметр      | Тип     | По умолчанию                               | Описание                                                                     |
|---------------|---------|--------------------------------------------|------------------------------------------------------------------------------|
| v             | number  | 1.0                                        | Версия корзины. При несовпадении этого с значением в куках корзина очистится |
| queryParams   | array   | ['product_id']                             | Список параметров, по которым необходимо искать совпадение товара            |
| keys          | object  |                                            | Набор имен параметров                                                        |
| cookieNames   | object  | {cart: 'cart',cartVersion: 'cart-version'} | Имена создаваемых cookie-записей                                             |
| coreMethods   | object  | {}                                         | Интерфейс для переопределения метод ядра корзины                             |
| customSearch  | boolean | false                                      | Использование кастомного метода для поиска продукта                          |
| multipleQuery | boolean | false                                      | Использование поиска по многим ключам                                        |
| productModel  | object  | {product_id: 'number',count: 'number'}     | Шаблон валидации модели товара                                               |