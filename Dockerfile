FROM php:8.3-apache

# git binary + PHP extensions Gitto needs
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev \
    && docker-php-ext-install zip pdo_mysql \
    && a2enmod rewrite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Copy Gitto
COPY . .

# Composer if you have it
RUN if [ -f composer.json ]; then \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader; \
    fi

# Create dirs that CapRover will make persistent
RUN mkdir -p repos data && chown -R www-data:www-data . && chmod -R 775 repos data

# Allow .htaccess
RUN echo '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>' > /etc/apache2/conf-available/gitto.conf && a2enconf gitto

EXPOSE 80
CMD ["apache2-foreground"]
