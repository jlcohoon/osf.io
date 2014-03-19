import bleach
import urllib

# TODO: Test me @jmcarp

def sanitize(s, **kwargs):
    return bleach.clean(s, **kwargs)


def process_data(data, func):
    if isinstance(data, dict):
        return {
            key: process_data(value, func)
            for key, value in data.items()
        }
    elif isinstance(data, list):
        return [
            process_data(item, func)
            for item in data
        ]
    return func(data)


def process_payload(data):
    return process_data(
        data,
        lambda value: urllib.quote(value.encode('utf-8'), safe=' ')
    )


def unprocess_payload(data):
    return process_data(
        data,
        lambda value: urllib.unquote(value.encode('utf-8'))
    )


def jsonify(form):
    """Cast WTForm to JSON object.

    """
    return {
        'form': [
            {
                'id': field.id,
                'label': str(field.label),
                'html': str(field),
                'description': str(field.description)
            }
            for field in form
        ]
    }
