from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in whatsapp_business/__init__.py
from whatsapp_business import __version__ as version

setup(
	name="whatsapp_business",
	version=version,
	description="Whatsapp Business Solution Providers Integration",
	author="Greycube",
	author_email="info@greycube.in",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
