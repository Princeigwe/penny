from langchain_core.messages import trim_messages
from langchain_core.messages.utils import count_tokens_approximately


def trimmed_messages(messages: list):
    trimmed_messages = trim_messages(
        messages,
        strategy="last",  # prioritize the last messages
        token_counter=count_tokens_approximately,
        max_tokens=5000,  # max token count of trimmed messages.
        start_on="human",
        end_on=("human", "tool"),
        include_system=True,
    )

    return trimmed_messages
