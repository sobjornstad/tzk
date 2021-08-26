import functools

def _lazy_evaluable(func):
    """
    Decorator which makes a function lazy-evaluable: that is, when it's
    initially called, it returns a zero-argument lambda with the arguments
    initially passed wrapped up in it. Calling that lambda has the effect
    of executing the function.

    We use this in TZK to allow the user to use function calls in her config
    to define the build steps, while not requiring her to write a bunch of
    ugly and confusing lambda:'s in the config. The functions that will be called
    are prepared during the config and executed later.
    """

    @functools.wraps(func)
    def new_func(*args, **kwargs):
        my_args = args
        my_kwargs = kwargs
        @functools.wraps(new_func)
        def inner():
            func(*my_args, **my_kwargs)
        return inner
    return new_func

# Now a more descriptive name that doesn't expose inner workings
# if the user wants to write her own builder.
tzk_builder = _lazy_evaluable

@tzk_builder
def printer(username: str):
    if username == 'Maud':
        raise Exception("No Mauds allowed!")
    print(f"Hallelujah, {username} built a wiki!")
printer.name = "Display the user's name"
