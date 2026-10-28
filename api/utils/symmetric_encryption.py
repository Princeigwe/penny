import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv(override=True)


# def generate_encryption_key():
#   key = Fernet.generate_key()
#   print("ENCRYPTION KEY: ", key)
#   return key

encryption_key_string = os.environ.get("ENCRYPTION_KEY")
encryption_key_bytes = encryption_key_string.encode() # converting the string encryption key to bytes
cipher_suite = Fernet(encryption_key_bytes)


def encrypt_data(data: str):
  data_bytes = data.encode() # converting the string data to bytes
  encrypted_data = cipher_suite.encrypt(data_bytes)
  return encrypted_data

## reason for using string and encoding is that the encrypted data will be stored as string in the database
# so when decrypting, we need to convert the string data to bytes first
def decrypt_data(data: str):
  data_bytes = data.encode() # converting the string data to bytes
  decrypted_data = cipher_suite.decrypt(data_bytes)
  decrypt_data_string = decrypted_data.decode() # converting the decrypted bytes data to string
  return decrypt_data_string


## TESTING OUT SCRIPT ##

# if __name__ == "__main__":
  # plain_data = "3pf15469j9969004a"
  # encrypted_data = encrypt_data(plain_data)
  # print("ENCRYPTED DATA: ", encrypted_data)
  # decrypted_data = decrypt_data("gAAAAABq3qCtd8MkVkUhOFHMRaW2MLfu3GiucoQE3bEYWhDJZquGO6gFbE7mHSAXshVPEQdwVMTDrtjYtaMgop5CUDnftzEPAiH940_cE0LpUiR5RdJAlZc=")
  # print("DECRYPTED DATA: ", decrypted_data)