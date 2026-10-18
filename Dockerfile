FROM php:8.2-apache

# Copy all Gitto files
COPY . /var/www/html/

# Enable Apache rewrite (for Laravel / .htaccess)
RUN a2enmod rewrite
RUN chown -R www-data:www-data /var/www/html

# For Laravel
RUN docker-php-ext-install pdo pdo_mysql

EXPOSE 80
