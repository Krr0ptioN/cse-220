"""Views for restaurant endpoints."""

from api_http import Controller, controller, delete, get, patch, post
from restaurants.dtos import RestaurantDto
from restaurants.models import Restaurant, Category, PriceRange
from users.models import UserRole
import json

@controller()
class RestaurantsController(Controller):
    """Controller for restaurant endpoints."""

    @get()
    def restaurants_list(self):
        """Return paginated restaurant results with DTO serialization."""
        include_fields, omit_fields, with_fields = self.list_query_fields()
        active_with_fields = self.resolve_list_with_fields(
            RestaurantDto,
            include_fields=include_fields,
            with_fields=with_fields,
        )

        queryset = self.apply_list_query_options(
            Restaurant.objects.all(),
            dto_class=RestaurantDto,
            active_with_fields=active_with_fields,
        )

        page_obj, pagination = self.paginate_queryset(queryset)

        data = RestaurantDto.from_models(
            page_obj.object_list,
            include=include_fields or None,
            omit=omit_fields or None,
            with_=active_with_fields,
        )

        return self.json(
            {
                "data": data,
                "pagination": pagination,
            }
        )

    @get("<slug:slug>/")
    def restaurant_detail(self, slug):
        """Return restaurant detail with full DTO serialization."""
        restaurant = Restaurant.objects.filter(slug=slug).first()
        if restaurant is None:
            return self.error(
                status=404,
                code="not_found",
                message="Restaurant not found.",
            )

        data = RestaurantDto.from_model(restaurant)
        return self.json({"data": data})

    @post()
    def restaurant_create(self):
        """Scaffold for owner-only restaurant creation."""
        # TODO(implementation guide):
        # 1) Auth check with request user + api_http error helper.
        #    - user = getattr(self.request, "user", None)
        #    - if user is None or not user.is_authenticated:
        #        return self.error(status=401, code="auth_required", message="Authentication is required.")
        #
        # 2) Role check for owners.
        #    - from users.models import UserRole
        #    - if user.role != UserRole.OWNER:
        #        return self.error(status=403, code="forbidden", message="Only restaurant owners can create restaurants.")
        #
        # 3) Parse request JSON body and validate required fields.
        #    - validate at least: name, description, category_id, address_line1, city
        #    - validate category exists (Category.objects.filter(id=...).first())
        #    - validate enums like price_range against model choices
        #
        # 4) Persist model using Django ORM.
        #    - restaurant = Restaurant.objects.create(..., owner=user, category=category)
        #
        # 5) Serialize and return using new DTO + api_http helper.
        #    - return self.created({"data": RestaurantDto.from_model(restaurant)})
        return self.error(
            status=501,
            code="not_implemented",
            message="restaurant_create is scaffolded but not implemented.",
        )

    @patch("<slug:slug>/")
    def restaurant_update(self, slug):
        """Scaffold for owner-only restaurant update."""
        user = getattr(self.request, "user", None)
        if user is None or not user.is_authenticated:
            return self.error(
                status=401,
                code="auth_required",
                message="Authentication is required.",
            )
        if user.role != UserRole.OWNER:
            return self.error(
                status=403,
                code="forbidden",
                message="Only restaurant owners can update their restaurants.",
            )

        restaurant = Restaurant.objects.filter(slug=slug).first()
        if restaurant is None:
            return self.error(
                status=404,
                code="not_found",
                message="Restaurant not found.",
            )
        if restaurant.owner_id != user.id: 
            return self.error(
                status=403, 
                code="forbidden", 
                message="You can only update your own restaurants.")

        try:
            body = json.loads(self.request.body)
        except (json.JSONDecodeError, ValueError):
            return self.error(
                status=400,
                code="invalid_json",
                message="Request body contains invalid JSON.",
            )
        allowed_fields = {
            "name": str,
            "description": str,
            "phone": str,
            "website": str,
            "address_line1": str,
            "address_line2": str,
            "city": str,
            "district": str,
            "postal_code": str,
            "price_range": str,
            "category_id": str,
        }
        update_fields = {}
        for field, field_type in allowed_fields.items():
            if field in body:
                value = body[field]
                if not isinstance(value, field_type):
                    return self.error(
                        status=400,
                        code="invalid_field_type",
                        message=f"Field '{field}' must be of type {field_type.__name__}.",
                    )
                update_fields[field] = value    
        if not update_fields:
            return self.error(
                status=400,
                code="empty_payload",
                message="At least one valid field must be provided for update.",
            )
        
        if "price_range" in update_fields:
            price_range_value = update_fields["price_range"]
            if price_range_value not in PriceRange.values:
                return self.error(
                    status=400,
                    code="invalid_price_range",
                    message=f"Invalid price range. Allowed values are: {', '.join(PriceRange.values)}.",
                )

        if "category_id" in update_fields:
            category = Category.objects.filter(id=update_fields["category_id"]).first()
            if category is None:
                return self.error(
                    status=400,
                    code="invalid_category",
                    message="Category with the provided ID does not exist.",
                )
            update_fields["category"] = category
            del update_fields["category_id"]

        for field, value in update_fields.items():
            setattr(restaurant, field, value)
        restaurant.save()
        return self.json({"data": RestaurantDto.from_model(restaurant)})

    @delete("<slug:slug>/")
    def restaurant_delete(self, slug):
        """Scaffold for admin-only restaurant deletion."""
        user = getattr(self.request, "user", None)
        if user is None or not user.is_authenticated:
            return self.error(
                status=401,
                code="auth_required",
                message="Authentication is required.",
            )

        if user.role != UserRole.ADMIN:
            return self.error(
                status=403,
                code="forbidden",
                message="Only admins can delete restaurants.",
            )

        restaurant = Restaurant.objects.filter(slug=slug).first()
        if restaurant is None:
            return self.error(
                status=404,
                code="not_found",
                message="Restaurant not found.",
            )

        restaurant.delete()
        return self.no_content()
