/**
 * Simple Cart
 * @return {{init: init, add: add, delete: delete, set: set, deleteAll: deleteAll, getProduct: getProduct, formatPrice: formatPrice, getNumEnding: getNumEnding}}
 * @param settings
 */

var Cart = function (settings) {
    Math.sign = Math.sign || function (x) {
            "use strict";
            x = +x;
            if (x === 0 || isNaN(x)) {
                return x;
            }
            return x > 0 ? 1 : -1;
        };

    /** Объект для хранения переменных и состояния корзины */
    var state = this.state = {
        options: $.extend(true, {
            v: 1.0,
            debug: false,
            queryParams: ['product_id'],
            keys: {
                discountPrice: false,
                price: 'price',
                totalProduct: 'total',
                count: 'count'
            },
            cookieNames: {
                cart: 'cart',
                cartVersion: 'cart-version'
            },
            coreMethods: {},
            customSearch: false,
            multipleQuery: false,
            productModel: {}
        }, settings),
        products: []
    };

    /** Проверяет текущую версию корзины */
    var checkCartVersion = function () {
        if (Cookies.get(state.options.cookieNames.cartVersion) == undefined) {
            Cookies.set(state.options.cookieNames.cartVersion, state.options.v, {path: '/'});
        }
        return (parseFloat(Cookies.get(state.options.cookieNames.cartVersion)) == state.options.v);
    };

    var trigger = function (event, options) {
        $(window).trigger(event, options);
    };

    /** Внутренние методы для работы с корзиной */
    var core = $.extend({

        /**
         * Товар в корзине по его ID
         * @param {object} productModel модель продукта
         * @returns {Object|null} ссылка на объект в корзине
         */
        getProductById: function (productModel) {
            "use strict";
            var productId = productModel[state.options.queryParams[0]];
            var result = null;

            $.each(state.products, function (key, value) {
                if (value[state.options.queryParams[0]] === productId) {
                    result = state.products[key];
                    return false;
                }
            });

            return result;
        },

        /**
         * Товар в корзине по нескольким параметрам
         * @param {object} productModel модель продукта
         * @returns {Object|null} ссылка на объект в корзине
         */
        getProductByParams: function (productModel) {
            "use strict";

            var result = null;
            var hasProduct = null;

            $.each(state.products, function (keyInCart, productInCart) {

                hasProduct = true;

                $.each(state.options.queryParams, function (key, queryParam) {
                    if (productInCart[queryParam] !== productModel[queryParam]) {
                        hasProduct = false;
                        return false;
                    }
                });

                if (hasProduct) {
                    result = state.products[keyInCart];
                    return false;
                }
            });

            return result;
        },

        /**
         * Проверка валидности модели
         * @param {object} productModel модель продукта
         * @returns {boolean}
         */
        checkValidityProduct: function (productModel) {
            "use strict";
            $.each(state.options.productModel, function (key, value) {
                if (key == undefined || typeof productModel[key] !== value) {
                    throw new TypeError('Product Model is invalid');
                }
            });
            return true;
        },

        /**
         * Обновление параметров продукта
         * @param {object} productModel модель продукта
         * @param {number} count новое число продукта
         * @param {boolean} isSet флаг, показывающий присвоить новый count или прибавить к текущему
         * @returns {Object|null} ссылка на объект в корзине или null, если продукт был удалён
         */
        updateProduct: function (productModel, count, isSet) {
            "use strict";

            var result = this.searchProduct(productModel);

            // Если не передан count в модели
            if (result[state.options.keys.count] == undefined) {
                result[state.options.keys.count] = 0;
            }

            if (!isSet) {
                result[state.options.keys.count] += count;
            } else {
                result[state.options.keys.count] = count;
            }

            // Проверка не нежуно ли удалить продукт
            if (result[state.options.keys.count] < 1) {
                $.each(state.products, function (key, productInCart) {
                    if (productInCart[state.options.keys.count] < 1) {
                        state.products.splice(key, 1);
                        return false;
                    }
                });

                result = this.searchProduct(productModel);
            }

            return result;
        },

        /**
         * Создание продукта
         * @param {object} productModel модель продукта
         * @param {number} count новое число продукта
         * @returns {Object} ссылка на объект в корзине
         */
        createProduct: function (productModel, count) {
            "use strict";
            productModel[state.options.keys.count] = count;
            state.products.push(productModel);
            return productModel;
        },

        /**
         * Поиск продукта в корзине
         * @param {object} productModel модель продукта
         * @returns {Object|null} ссылка на объект в корзине или null, если продукт не найден
         */
        searchProduct: function (productModel) {
            "use strict";
            if (state.options.customSearch) {
                return this.getProduct(productModel);
            }

            if (state.options.multipleQuery) {
                return this.getProductByParams(productModel);
            } else {
                return this.getProductById(productModel);
            }
        },

        /**
         * Проверка наличия продукта в корзине
         * @param {object} productModel модель продукта
         * @returns {boolean}
         */
        hasProduct: function (productModel) {
            "use strict";

            return (this.searchProduct(productModel) !== null);
        },

        /**
         * Обновить корзину
         * @returns {Array} продукты корзины
         */
        updateCart: function () {
            "use strict";

            $.each(state.products, function (key, productInCart) {
                if (productInCart[state.options.keys.count] > 0) {
                    productInCart[state.options.keys.totalProduct] = productInCart[state.options.keys.count] * (productInCart[state.options.keys.discountPrice] || productInCart[state.options.keys.price]);
                }
            });

            trigger('cart.update', {
                cart: state.products
            });
            return state.products;
        },

        response: function (response) {
            "use strict";

            this.updateCart();
            this.updateCookie();
            return response;
        },

        /**
         * Получить корзину из cookie
         * @returns {Array}
         */
        getCart: function () {
            "use strict";

            state.products = this.formatToWork(Cookies.getJSON(state.options.cookieNames.cart) || []);
            return state.products;
        },

        /**
         * Обновить cookie на содержимое массива state.products
         */
        updateCookie: function () {
            "use strict";

            var date = new Date();
            date.setTime(date.getTime() + (180 * 60 * 1000));
            Cookies.set(state.options.cookieNames.cart, JSON.stringify(this.formatToSave(state.products)), {
                path: '/',
                expires: date
            });
        },

        deleteCookie: function (cookieName) {
            "use strict";

            return Cookies.remove(cookieName, {path: '/'});
        },

        /**
         * Отредактировать данные для сохранения в cookie
         * и дальнейшей передачи на сервер. Например, необходимо добавить
         * время заказа и идентификатор.
         * @param {Object} cart корзина
         * @returns {Object} отформатированная корзина
         */
        formatToSave: function (cart) {
            return cart;
        },

        /**
         * Метод, обратный для formatToSave.
         * Здесь можно очистить корзину от лишних параметров или изменить вложенность продуктов.
         * @param {Object} cart корзина
         * @returns {Object} отформатированная корзина
         */
        formatToWork: function (cart) {
            return cart;
        }

    }, state.options.coreMethods);

    return {
        init: function () {
            'use strict';
            if (state.options.queryParams.length > 1) {
                state.options.multipleQuery = true;
            }
            if (!checkCartVersion()) {
                core.deleteCookie(state.options.cookieNames.cart);
                Cookies.set(state.options.cookieNames.cartVersion, state.options.v, {path: '/'});
            }

            state.products = core.getCart();

            core.updateCart();
            core.updateCookie();
            trigger('cart.init', {
                cart: state.products
            });
        },

        add: function (productModel, count, callback) {
            'use strict';
            core.checkValidityProduct(productModel);

            if (typeof count !== 'number') {
                count = 1;
            } else {
                // Всегда положительное число
                count = Math.abs(count);
            }

            var result = core.hasProduct(productModel) ? core.updateProduct(productModel, count) : core.createProduct(productModel, count);

            callback = callback || $.noop;
            callback(result, state.products);
            return core.response(result);
        },

        delete: function (productModel, count, callback) {
            'use strict';
            core.checkValidityProduct(productModel);

            if (typeof count !== 'number') {
                count = -1;
            } else {
                // Всегда отрицательное число
                count = Math.abs(count) * -1;
            }

            var result = core.hasProduct(productModel) ? core.updateProduct(productModel, count) : null;

            callback = callback || $.noop;
            callback(result, state.products);
            return core.response(result);
        },

        set: function (productModel, count, callback) {
            'use strict';
            core.checkValidityProduct(productModel);

            if (typeof count !== 'number') {
                count = 1;
            } else {
                // Всегда положительное число
                count = Math.abs(count);
            }

            var result = core.hasProduct(productModel) ? core.updateProduct(productModel, count, true) : core.createProduct(productModel, count);

            callback = callback || $.noop;
            callback(result, state.products);
            return core.response(result);
        },

        deleteAll: function (productModel, callback) {
            'use strict';
            core.checkValidityProduct(productModel);

            var product = core.hasProduct(productModel);
            var result = product ? core.updateProduct(productModel, product[state.options.keys.count]) : null;

            callback = callback || $.noop;
            callback(result, state.products);
            return core.response(result);
        },

        getProduct: function (productModel) {
            'use strict';
            core.checkValidityProduct(productModel);
            return core.response(core.searchProduct(productModel));
        },

        getTotalSumByProduct: function (productModel) {
            'use strict';
            core.checkValidityProduct(productModel);

            var product = core.response(core.searchProduct(productModel));

            var result = {};

            if (product) {
                result.discountPrice = product[state.options.keys.count] * product[state.options.keys.discountPrice];
                result.total = product[state.options.keys.totalProduct];
                result.count = product[state.options.keys.count];
            }

            return product ? result : null;
        },

        /**
         * Форматирование цены, например 1000 => 1 000
         * @param {number} number число для преобразования
         * @param {string} separator разделитель между разрядами
         * @param {RegExp} regExp Можно передать своё регулярно выражение, для добавления точки, а не пробела
         * @returns {string} форматированное число
         */
        formatPrice: function (number, separator, regExp) {
            'use strict';
            number = parseInt(number.toString().replace(/\D+/g, ""));
            regExp = regExp || /(\d)(?=(\d{3})+(?!\d))/g;
            separator = separator || ' ';

            if (typeof number !== 'number') {
                throw new TypeError('Не является числом');
            }
            return number.toString().replace(regExp, "$1" + separator);
        },

        /**
         * Возвращает окончание для множественного числа слова на основании числа и массива окончаний
         * @param {number} iNumber Число на основе которого нужно сформировать окончание
         * @param {Array} aEndings Массив слов или окончаний для чисел
         * @return {string}
         */
        getNumEnding: function (iNumber, aEndings) {
            var sEnding, i;
            iNumber = iNumber % 100;
            if (iNumber >= 11 && iNumber <= 19) {
                sEnding = aEndings[2];
            }
            else {
                i = iNumber % 10;
                switch (i) {
                    case (1):
                        sEnding = aEndings[0];
                        break;
                    case (2):
                    case (3):
                    case (4):
                        sEnding = aEndings[1];
                        break;
                    default:
                        sEnding = aEndings[2];
                }
            }
            return sEnding;
        },

        state: state
    }
};

