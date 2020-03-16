from setuptools import setup, find_packages  # Always prefer setuptools over distutils
from codecs import open  # To use a consistent encoding
from os import path

here = path.abspath(path.dirname(__file__))

# Get the long description from the relevant file
with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='multilevel',

    # Versions should comply with PEP440.  For a discussion on single-sourcing
    # the version across setup.py and the project code, see
    # https://packaging.python.org/en/latest/single_source_version.html
    # version='0.1.dev0',
    # according to https://semver.org/
    version='1.0.11',
    description='multilevel optimization and visualization strategies of networks',
    long_description=long_description,
    url='https://github.com/ttm/ml-net-gui',
    author='VICG/ICMC/USP',
    author_email='renato.fabbri@gmail.com',

    license='MIT',

    # See https://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        #   3 - Alpha, 4 - Beta, 5 - Production/Stable
        'Development Status :: 4 - Beta',

        # Indicate who your project is intended for
        'Intended Audience :: Science/Research',
        'Intended Audience :: Developers',
        'Intended Audience :: Education',
        'Intended Audience :: Other Audience',

        'Topic :: Scientific/Engineering :: Physics',
        'Topic :: Scientific/Engineering :: Visualization',
        'Topic :: Scientific/Engineering :: Information Analysis',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'Topic :: Other/Nonlisted Topic',

        'License :: OSI Approved :: MIT License',

        'Programming Language :: Python :: 3',
    ],
    keywords=['complex networks', 'multilevel strategies', 'multilevel optimization', 'data visualization', 'data mining', 'graph', 'network science'],

    packages=["multilevel"],
    install_requires=['networkx', 'numpy', 'Flask', 'flask-cors', 'pymongo',  # multilevel package, aux server
        'python-igraph', 'pyyaml', 'PyPDF2', 'scipy', 'sharedmem'],  # mlpb
)
